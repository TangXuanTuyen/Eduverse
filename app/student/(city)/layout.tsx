import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/session';
import { getMyRooms } from '@/services/rooms';
import { StudentGameProvider } from '@/components/student/StudentGameProvider';
import { CityShell } from '@/components/student/CityShell';

export default async function StudentCityLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole('student');
  const rooms = await getMyRooms();
  if (rooms.length === 0) redirect('/student/join-room');

  const roomName = rooms[0]?.name ?? '';

  return (
    <StudentGameProvider identity={{ userId: profile.id, displayName: profile.displayName, className: roomName }}>
      <CityShell>{children}</CityShell>
    </StudentGameProvider>
  );
}
