import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { homeForRole, isAppRole, ONBOARDING_PATH, type AppRole } from '@/lib/auth/roles';

export type CurrentProfile = {
  id: string;
  role: AppRole | null;
  displayName: string;
  avatarUrl: string | null;
  grade: number | null;
};

export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, display_name, avatar_url, grade')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;

  return {
    id: data.id,
    role: isAppRole(data.role) ? data.role : null,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    grade: data.grade,
  };
});

export async function requireRole(...allowed: AppRole[]): Promise<CurrentProfile & { role: AppRole }> {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (!profile.role) redirect(ONBOARDING_PATH);
  if (!allowed.includes(profile.role)) redirect(homeForRole(profile.role));
  return profile as CurrentProfile & { role: AppRole };
}
