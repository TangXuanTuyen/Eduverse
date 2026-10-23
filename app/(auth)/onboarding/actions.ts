'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getCurrentProfile } from '@/lib/auth/session';
import { homeForRole, type AppRole } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

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

  const updates: Record<string, unknown> = { role };

  if (!profile.displayName) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const googleName = userData?.user?.user_metadata?.full_name
      ?? userData?.user?.user_metadata?.name
      ?? '';
    if (googleName) updates.display_name = googleName;
  }

  const { error } = await admin
    .from('profiles')
    .update(updates)
    .eq('id', profile.id);

  if (error) {
    console.error('[onboarding] update error', error);
    return { error: 'Có lỗi xảy ra, thử lại sau.' };
  }

  redirect(homeForRole(role));
}
