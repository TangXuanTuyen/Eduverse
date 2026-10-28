import type { Metadata } from 'next';
import { getCurrentProfile } from '@/lib/auth/session';
import { getTeacherRooms, getRoomMemberCount } from '@/services/rooms';
import { redirect } from 'next/navigation';
import { CreateRoomForm } from './CreateRoomForm';
import { RoomCard } from './RoomCard';
import { Users } from 'lucide-react';
import { getLocale } from '@/lib/i18n/server';
import { translate } from '@/lib/i18n/dict';

export const metadata: Metadata = { title: 'Phòng học của tôi' };

export default async function TeacherRoomsPage() {
  const locale = await getLocale();
  const tr = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') redirect('/');

  const rooms = await getTeacherRooms(profile.id);
  const roomsWithCount = await Promise.all(
    rooms.map(async (r) => ({
      ...r,
      memberCount: await getRoomMemberCount(r.id, profile.id),
    }))
  );

  const totalStudents = roomsWithCount.reduce((s, r) => s + r.memberCount, 0);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{tr('rooms.title')}</h1>
          <p className="text-sm text-slate-400 mt-1">
            {roomsWithCount.length} {tr('rooms.roomsUnit')} · {totalStudents} {tr('rooms.studentsUnit')}
          </p>
        </div>
      </div>

      <CreateRoomForm />

      {roomsWithCount.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400 text-center">{tr('rooms.empty')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {roomsWithCount.map((r) => (
            <RoomCard key={r.id} room={r} />
          ))}
        </div>
      )}
    </div>
  );
}
