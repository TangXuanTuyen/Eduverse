import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth/session';
import { AuthCard } from '@/components/auth/AuthCard';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { ChangePasswordForm } from './ChangePasswordForm';

export const metadata: Metadata = { title: 'Đổi mật khẩu' };

export default async function ChangePasswordPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  return (
    <AuthCard
      title={profile.mustChangePassword ? 'Tạo mật khẩu của riêng em' : 'Đổi mật khẩu'}
      subtitle={
        profile.mustChangePassword
          ? 'Đây là lần đăng nhập đầu tiên. Hãy đổi mật khẩu tạm thành mật khẩu chỉ mình em biết nhé.'
          : undefined
      }
    >
      <ChangePasswordForm />
      <div className="mt-4 flex justify-center">
        <SignOutButton />
      </div>
    </AuthCard>
  );
}
