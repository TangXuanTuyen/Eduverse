import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth/session';
import { homeForRole } from '@/lib/auth/roles';
import { AuthCard } from '@/components/auth/AuthCard';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Đăng nhập' };

export default async function LoginPage() {
  const profile = await getCurrentProfile();
  if (profile) redirect(homeForRole(profile.role));

  return (
    <AuthCard title="Đăng nhập VINA-EDUVERSE" subtitle="Thành phố học Khoa học tự nhiên">
      <LoginForm />
    </AuthCard>
  );
}
