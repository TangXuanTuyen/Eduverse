import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth/session';
import { homeForRole } from '@/lib/auth/roles';

export default async function Home() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (profile.mustChangePassword) redirect('/doi-mat-khau');
  redirect(homeForRole(profile.role));
}
