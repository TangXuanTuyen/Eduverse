import type { Metadata } from 'next';
import { getCurrentProfile } from '@/lib/auth/session';
import { getTeacherRooms, getRoomMemberCount } from '@/services/rooms';
import { redirect } from 'next/navigation';
import { CreateRoomForm } from './CreateRoomForm';
import { RoomCard } from './RoomCard';

export const metadata: Metadata = { title: 'Phòng học của tôi' };

export default async function TeacherRoomsPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') redirect('/');

  const rooms = await getTeacherRooms(profile.id);
  const roomsWithCount = await Promise.all(
    rooms.map(async (r) => ({
      ...r,
      memberCount: await getRoomMemberCount(r.id),
    }))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Phòng học của tôi</h1>
      </div>

      <CreateRoomForm />

      {roomsWithCount.length === 0 ? (
        <p className="text-slate-400 text-center py-8">Chưa có phòng nào. Tạo phòng đầu tiên!</p>
      ) : (
        <div className="space-y-3">
          {roomsWithCount.map((r) => (
            <RoomCard key={r.id} room={r} />
          ))}
        </div>
      )}
    </div>
  );
}
