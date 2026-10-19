import { z } from 'zod';

/** Biến môi trường công khai (an toàn khi lộ ra trình duyệt). */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({ message: 'Thiếu hoặc sai NEXT_PUBLIC_SUPABASE_URL' }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string({ message: 'Thiếu NEXT_PUBLIC_SUPABASE_ANON_KEY' })
    .min(20, 'Thiếu NEXT_PUBLIC_SUPABASE_ANON_KEY'),
});

export function publicEnv() {
  // Phải viết tên biến tường minh để Next.js nhúng giá trị vào bundle trình duyệt
  return publicSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}
