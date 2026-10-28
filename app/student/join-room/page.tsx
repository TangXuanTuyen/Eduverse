import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth/session';
import { getMyRooms } from '@/services/rooms';
import { AuthCard } from '@/components/auth/AuthCard';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { JoinRoomForm } from './JoinRoomForm';

export const metadata: Metadata = { title: 'Nhập mã phòng' };

export default async function JoinRoomPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (profile.role !== 'student') redirect('/');

  const rooms = await getMyRooms();
  if (rooms.length > 0) redirect('/student');

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="flex-1">
        <AuthCard title="Tham gia phòng học" subtitle="Nhập mã phòng từ thầy cô">
          <JoinRoomForm />
        </AuthCard>
      </div>
      <SiteFooter />
    </div>
  );
}
