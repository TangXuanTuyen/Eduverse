import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { publicEnv } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { hashKey, LOGIN_LIMITS } from '@/services/login-core';

export type ChangePasswordResult = { ok: true } | { ok: false; error: string };

/**
 * Đổi mật khẩu cho người đang đăng nhập (dùng cho lần đầu bắt buộc đổi).
 * Kiểm tra lại mật khẩu hiện tại bằng một client tạm không lưu phiên,
 * rồi cập nhật mật khẩu và tắt cờ must_change_password bằng service_role.
 */
export async function changeOwnPassword(input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<ChangePasswordResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user || user.id !== input.userId || !user.email) {
    return { ok: false, error: 'Phiên đăng nhập đã hết, hãy đăng nhập lại.' };
  }

  const admin = createAdminClient();
  const idKey = hashKey('id', user.email.toLowerCase());
  const { data: lockedUntil } = await admin.rpc('login_lock_status', { p_key: idKey });
  if (lockedUntil) {
    return { ok: false, error: 'Bạn đã nhập sai nhiều lần. Hãy thử lại sau ít phút.' };
  }

  const env = publicEnv();
  const verifier = createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: input.currentPassword,
  });
  if (verifyError) {
    await admin.rpc('login_record_failure', { p_key: idKey, p_max_failures: LOGIN_LIMITS.identifier.maxFailures });
    return { ok: false, error: 'Mật khẩu hiện tại chưa đúng.' };
  }
  await verifier.auth.signOut();

  const { error: updateError } = await supabase.auth.updateUser({ password: input.newPassword });
  if (updateError) {
    return { ok: false, error: 'Chưa đổi được mật khẩu, thử mật khẩu khác nhé.' };
  }

  const { error: flagError } = await admin
    .from('profiles')
    .update({ must_change_password: false })
    .eq('id', user.id);
  if (flagError) throw new Error(`Không cập nhật được must_change_password: ${flagError.message}`);

  await admin.rpc('login_clear', { p_key: idKey });
  return { ok: true };
}
