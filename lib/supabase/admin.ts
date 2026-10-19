import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { publicEnv } from '@/lib/env';
import { serverEnv } from '@/lib/env.server';

/**
 * Client service_role: BỎ QUA RLS. Chỉ dùng trong code server sau khi đã tự kiểm tra quyền
 * (tạo tài khoản, gán vai trò, đặt lại mật khẩu, đếm đăng nhập sai).
 */
export function createAdminClient() {
  return createClient(publicEnv().NEXT_PUBLIC_SUPABASE_URL, serverEnv().SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
