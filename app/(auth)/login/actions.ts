'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { loginWithPassword } from '@/services/login';
import { getCurrentProfile } from '@/lib/auth/session';
import { homeForRole } from '@/lib/auth/roles';

export type LoginState = { error?: string; identifier?: string };

const schema = z.object({
  identifier: z.string().trim().min(1, 'Nhập mã học sinh hoặc email').max(254),
  password: z.string().min(1, 'Nhập mật khẩu').max(200),
});

const INVALID = 'Mã học sinh/email hoặc mật khẩu chưa đúng. Thử lại nhé!';

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    identifier: formData.get('identifier'),
    password: formData.get('password'),
  });
  const identifier = String(formData.get('identifier') ?? '').slice(0, 254);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? INVALID, identifier };
  }

  const h = await headers();
  // Trên Vercel, x-forwarded-for do hạ tầng đặt; phần tử đầu là IP máy khách
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || null;

  let result;
  try {
    result = await loginWithPassword({ ...parsed.data, ip });
  } catch (e) {
    console.error('[login] lỗi hệ thống', e);
    return { error: 'Hệ thống đang bận, thử lại sau ít phút nhé.', identifier };
  }

  if (!result.ok) {
    return {
      error:
        result.reason === 'locked'
          ? `Bạn đã nhập sai nhiều lần. Hãy thử lại sau ${result.retryAfterMinutes} phút, hoặc nhờ thầy cô đặt lại mật khẩu.`
          : INVALID,
      identifier,
    };
  }

  const profile = await getCurrentProfile();
  if (profile?.mustChangePassword) redirect('/doi-mat-khau');
  redirect(homeForRole(profile?.role));
}
