import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function joinRoom(code: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('join_room', { p_code: code });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function getMyRooms() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('room_members')
    .select('room_id, rooms(id, name, subject, grade)')
    .eq('is_active', true);
  return (data ?? []).map((d) => (d as Record<string, unknown>).rooms) as Array<{
    id: string; name: string; subject: string | null; grade: number | null;
  }>;
}

export async function createRoom(ownerId: string, name: string, subject?: string, grade?: number) {
  const admin = createAdminClient();
  const { data: code } = await admin.rpc('generate_join_code');

  const { data, error } = await admin
    .from('rooms')
    .insert({
      name,
      subject: subject || null,
      grade: grade || null,
      owner_id: ownerId,
      join_code: code,
      join_code_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('id, join_code')
    .single();

  if (error) throw new Error(error.message);

  await admin.from('room_members').insert({
    room_id: data.id,
    user_id: ownerId,
  });

  return data as { id: string; join_code: string };
}

export async function getTeacherRooms(teacherId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('rooms')
    .select('id, name, subject, grade, join_code, join_code_expires_at, is_active, created_at')
    .eq('owner_id', teacherId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function refreshJoinCode(roomId: string, ownerId: string) {
  const admin = createAdminClient();
  const { data: room } = await admin.from('rooms').select('owner_id').eq('id', roomId).single();
  if (!room || room.owner_id !== ownerId) throw new Error('Không có quyền');

  const { data: code } = await admin.rpc('generate_join_code');
  await admin
    .from('rooms')
    .update({
      join_code: code,
      join_code_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq('id', roomId);
  return code as string;
}

export async function updateRoom(roomId: string, ownerId: string, updates: { name?: string; subject?: string | null; grade?: number | null }) {
  const admin = createAdminClient();
  const { data: room } = await admin.from('rooms').select('owner_id').eq('id', roomId).single();
  if (!room || room.owner_id !== ownerId) throw new Error('Không có quyền');

  const { error } = await admin.from('rooms').update(updates).eq('id', roomId);
  if (error) throw new Error(error.message);
}

export async function deleteRoom(roomId: string, ownerId: string) {
  const admin = createAdminClient();
  const { data: room } = await admin.from('rooms').select('owner_id').eq('id', roomId).single();
  if (!room || room.owner_id !== ownerId) throw new Error('Không có quyền');

  await admin.from('room_members').delete().eq('room_id', roomId);
  const { error } = await admin.from('rooms').delete().eq('id', roomId);
  if (error) throw new Error(error.message);
}

export async function getRoomMemberCount(roomId: string) {
  const admin = createAdminClient();
  const { count } = await admin
    .from('room_members')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', roomId)
    .eq('is_active', true);
  return count ?? 0;
}
