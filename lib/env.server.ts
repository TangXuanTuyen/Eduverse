import 'server-only';
import { z } from 'zod';

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string({ message: 'Thiếu SUPABASE_SERVICE_ROLE_KEY (chỉ dùng ở server)' }).min(20, 'Thiếu SUPABASE_SERVICE_ROLE_KEY (chỉ dùng ở server)'),
});

/** Khóa bí mật — chỉ import từ code server. Không bao giờ đặt tiền tố NEXT_PUBLIC_. */
export function serverEnv() {
  return serverSchema.parse({ SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY });
}
