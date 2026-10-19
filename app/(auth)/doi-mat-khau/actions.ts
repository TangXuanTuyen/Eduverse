'use server';

import { redirect } from 'next/navigation';
import { changePasswordSchema } from '@/lib/auth/password';
import { getCurrentProfile } from '@/lib/auth/session';
import { homeForRole } from '@/lib/auth/roles';
import { changeOwnPassword } from '@/services/password';

export type ChangePasswordState = { error?: string; fieldErrors?: Record<string, string> };

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const parsed = changePasswordSchema(profile.studentCode).safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form');
      fieldErrors[key] ??= issue.message;
    }
    return { fieldErrors };
  }

  const result = await changeOwnPassword({
    userId: profile.id,
    currentPassword: parsed.data.currentPassword,
    newPassword: parsed.data.newPassword,
  });
  if (!result.ok) return { error: result.error };

  redirect(homeForRole(profile.role));
}
