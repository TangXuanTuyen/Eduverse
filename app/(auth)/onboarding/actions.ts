'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getCurrentProfile } from '@/lib/auth/session';
import { homeForRole, type AppRole } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/admin';

const schema = z.object({
  role: z.enum(['teacher', 'student', 'parent']),
});

export type OnboardingState = { error?: string };

export async function chooseRoleAction(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (profile.role) redirect(homeForRole(profile.role));

  const parsed = schema.safeParse({ role: formData.get('role') });
  if (!parsed.success) return { error: 'Vai trò không hợp lệ.' };

  const role = parsed.data.role as AppRole;
  const admin = createAdminClient();

  const { error } = await admin
    .from('profiles')
    .update({ role })
    .eq('id', profile.id);

  if (error) {
    console.error('[onboarding] update error', error);
    return { error: 'Có lỗi xảy ra, thử lại sau.' };
  }

  redirect(homeForRole(role));
}
