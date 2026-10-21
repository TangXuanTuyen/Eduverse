import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth/session';
import { homeForRole } from '@/lib/auth/roles';
import { AuthCard } from '@/components/auth/AuthCard';
import { OnboardingForm } from './OnboardingForm';

export const metadata: Metadata = { title: 'Chọn vai trò' };

export default async function OnboardingPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (profile.role) redirect(homeForRole(profile.role));

  return (
    <AuthCard title="Chào mừng đến VINA-EDUVERSE!" subtitle="Bạn là ai?">
      <OnboardingForm />
    </AuthCard>
  );
}
