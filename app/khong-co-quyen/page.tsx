import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth/session';
import { homeForRole } from '@/lib/auth/roles';
import { AuthCard } from '@/components/auth/AuthCard';
import { SignOutButton } from '@/components/auth/SignOutButton';

export const metadata: Metadata = { title: 'Chưa được cấp quyền' };

export default async function NoAccessPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (profile.role) redirect(homeForRole(profile.role));

  return (
    <AuthCard title="Tài khoản chưa được cấp quyền">
      <p className="text-sm text-slate-300 text-center">
        Tài khoản của bạn đã được tạo nhưng nhà trường chưa cấp vai trò. Hãy liên hệ quản trị nhà trường.
      </p>
      <div className="mt-6 flex justify-center">
        <SignOutButton />
      </div>
    </AuthCard>
  );
}
