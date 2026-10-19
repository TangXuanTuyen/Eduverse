import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { authenticate, type LoginResult } from '@/services/login-core';

/** Đăng nhập thật: đếm sai qua RPC (service_role), đăng nhập qua client có cookie. */
export async function loginWithPassword(input: {
  identifier: string;
  password: string;
  ip: string | null;
}): Promise<LoginResult> {
  const admin = createAdminClient();
  const supabase = await createClient();

  return authenticate(input, {
    async getLockedUntil(key) {
      const { data, error } = await admin.rpc('login_lock_status', { p_key: key });
      if (error) throw new Error(`login_lock_status: ${error.message}`);
      return data ? new Date(data as string) : null;
    },
    async recordFailure(key, maxFailures) {
      const { data, error } = await admin.rpc('login_record_failure', {
        p_key: key,
        p_max_failures: maxFailures,
      });
      if (error) throw new Error(`login_record_failure: ${error.message}`);
      return data ? new Date(data as string) : null;
    },
    async clearFailures(key) {
      const { error } = await admin.rpc('login_clear', { p_key: key });
      if (error) throw new Error(`login_clear: ${error.message}`);
    },
    async signIn(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) return { ok: false };
      return { ok: true, userId: data.user.id };
    },
  });
}
