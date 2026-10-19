import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { publicEnv } from '@/lib/env';

/**
 * Client Supabase cho Server Component / Server Action / Route Handler.
 * Tạo mới cho mỗi request (không dùng chung giữa các request).
 */
export async function createClient() {
  // Đọc cookies() trước để route được đánh dấu động (không prerender lúc build)
  const cookieStore = await cookies();
  const env = publicEnv();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Gọi từ Server Component (không ghi được cookie) — proxy.ts sẽ làm mới phiên.
        }
      },
    },
  });
}
