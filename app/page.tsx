import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth/session';
import { homeForRole } from '@/lib/auth/roles';

export default async function Home() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  redirect(homeForRole(profile.role));
}
