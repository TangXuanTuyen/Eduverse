import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type RoomSessionType = 'coop_boss' | 'sync_lesson' | 'stem_group';

export async function createRoomSession(
  roomId: string,
  createdBy: string,
  type: RoomSessionType,
  title: string,
  config: Record<string, unknown> = {}
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('room_sessions')
    .insert({ room_id: roomId, created_by: createdBy, type, title, config })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function startRoomSession(sessionId: string, teacherId: string) {
  const admin = createAdminClient();
  const { data: session } = await admin
    .from('room_sessions')
    .select('created_by, state')
    .eq('id', sessionId)
    .single();
  if (!session || session.created_by !== teacherId) throw new Error('Không có quyền');
  if (session.state !== 'waiting') throw new Error('Phiên không ở trạng thái chờ');

  await admin
    .from('room_sessions')
    .update({ state: 'active', started_at: new Date().toISOString() })
    .eq('id', sessionId);
}

export async function finishRoomSession(sessionId: string, teacherId: string) {
  const admin = createAdminClient();
  const { data: session } = await admin
    .from('room_sessions')
    .select('created_by, state')
    .eq('id', sessionId)
    .single();
  if (!session || session.created_by !== teacherId) throw new Error('Không có quyền');

  await admin
    .from('room_sessions')
    .update({ state: 'finished', finished_at: new Date().toISOString() })
    .eq('id', sessionId);
}

export async function advanceStep(sessionId: string, teacherId: string) {
  const admin = createAdminClient();
  const { data: session } = await admin
    .from('room_sessions')
    .select('created_by, state, current_step')
    .eq('id', sessionId)
    .single();
  if (!session || session.created_by !== teacherId) throw new Error('Không có quyền');
  if (session.state !== 'active') throw new Error('Phiên chưa bắt đầu');

  await admin
    .from('room_sessions')
    .update({ current_step: session.current_step + 1 })
    .eq('id', sessionId);

  return session.current_step + 1;
}

export async function joinRoomSession(sessionId: string, userId: string) {
  const admin = createAdminClient();
  await admin
    .from('room_session_participants')
    .upsert(
      { session_id: sessionId, user_id: userId },
      { onConflict: 'session_id,user_id' }
    );
}

export async function submitCoopAnswer(
  sessionId: string,
  userId: string,
  correct: boolean,
  damage: number,
  idempotencyKey: string
) {
  const admin = createAdminClient();

  // Idempotent: check if already answered for this step
  const { data: session } = await admin
    .from('room_sessions')
    .select('state, current_step, total_damage')
    .eq('id', sessionId)
    .single();
  if (!session || session.state !== 'active') throw new Error('Phiên không hoạt động');

  const { data: participant } = await admin
    .from('room_session_participants')
    .select('id, score, last_answer_at')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .single();
  if (!participant) throw new Error('Chưa tham gia phiên');

  // Server serializes damage
  if (correct) {
    await admin
      .from('room_sessions')
      .update({ total_damage: session.total_damage + damage })
      .eq('id', sessionId);

    await admin
      .from('room_session_participants')
      .update({
        score: participant.score + damage,
        last_answer_at: new Date().toISOString(),
      })
      .eq('id', participant.id);
  }

  return { totalDamage: session.total_damage + (correct ? damage : 0) };
}

export async function getActiveRoomSession(roomId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('room_sessions')
    .select('*, room_session_participants(user_id, score)')
    .eq('room_id', roomId)
    .in('state', ['waiting', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function updateSocialSettings(
  roomId: string,
  teacherId: string,
  settings: { social_enabled?: boolean; emotes_enabled?: boolean; active_hours_start?: string | null; active_hours_end?: string | null }
) {
  const admin = createAdminClient();
  const { data: room } = await admin.from('rooms').select('owner_id').eq('id', roomId).single();
  if (!room || room.owner_id !== teacherId) throw new Error('Không có quyền');

  await admin
    .from('social_settings')
    .upsert(
      { room_id: roomId, updated_by: teacherId, ...settings, updated_at: new Date().toISOString() },
      { onConflict: 'room_id' }
    );
}

export async function submitStudentReport(
  roomId: string,
  reporterId: string,
  reportedId: string,
  reason: string
) {
  const admin = createAdminClient();
  await admin.from('student_reports').insert({
    room_id: roomId,
    reporter_id: reporterId,
    reported_id: reportedId,
    reason,
  });
}
