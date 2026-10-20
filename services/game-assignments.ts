import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

export type GameAssignmentRow = {
  id: string;
  game_id: string;
  room_id: string;
  assigned_by: string;
  due_at: string | null;
  created_at: string;
  game_name?: string;
  question_count?: number;
  time_per_question?: number;
  mode?: string;
};

export async function assignGame(
  teacherId: string,
  gameId: string,
  roomId: string,
  dueAt?: string
) {
  const admin = createAdminClient();

  // Verify teacher owns the game
  const { data: game, error: gErr } = await admin
    .from('games')
    .select('id, status')
    .eq('id', gameId)
    .eq('owner_id', teacherId)
    .single();
  if (gErr || !game) throw new Error('Không tìm thấy trò chơi');
  if (game.status === 'draft') throw new Error('Trò chơi chưa sẵn sàng');

  const { error } = await admin.from('game_assignments').insert({
    game_id: gameId,
    room_id: roomId,
    assigned_by: teacherId,
    due_at: dueAt ?? null,
  });
  if (error) {
    if (error.code === '23505') throw new Error('Đã giao trò chơi này cho lớp rồi');
    throw new Error(error.message);
  }
}

export async function getStudentGameAssignments(userId: string) {
  const admin = createAdminClient();

  // Get rooms the student belongs to
  const { data: memberships } = await admin
    .from('room_members')
    .select('room_id')
    .eq('user_id', userId);
  if (!memberships || memberships.length === 0) return [];

  const roomIds = memberships.map((m: { room_id: string }) => m.room_id);

  const { data, error } = await admin
    .from('game_assignments')
    .select('*, games!inner(name, mode, time_per_question, status, game_questions(count))')
    .in('room_id', roomIds)
    .eq('games.status', 'ready')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map((a: Record<string, unknown>) => {
    const game = a.games as Record<string, unknown>;
    const qItems = game.game_questions as unknown;
    const qCount = Array.isArray(qItems) && qItems.length > 0
      ? (qItems[0] as { count: number }).count
      : 0;
    return {
      id: a.id,
      game_id: a.game_id,
      room_id: a.room_id,
      assigned_by: a.assigned_by,
      due_at: a.due_at,
      created_at: a.created_at,
      game_name: game.name,
      question_count: qCount,
      time_per_question: game.time_per_question,
      mode: game.mode,
    } as GameAssignmentRow;
  });
}

export async function getTeacherGameAssignments(teacherId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('game_assignments')
    .select('*, games!inner(name), rooms!inner(name)')
    .eq('assigned_by', teacherId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function startSoloSession(gameId: string, userId: string, displayName: string) {
  const admin = createAdminClient();

  // Verify game exists and is ready
  const { data: game, error: gErr } = await admin
    .from('games')
    .select('id, status, time_per_question, points_per_question')
    .eq('id', gameId)
    .single();
  if (gErr || !game) throw new Error('Không tìm thấy trò chơi');
  if (game.status === 'draft') throw new Error('Trò chơi chưa sẵn sàng');

  // Generate join code (reuse helper)
  const { data: codeResult } = await admin.rpc('generate_game_join_code');
  const joinCode = codeResult as string;

  // Create session as solo (created_by = student for solo)
  const { data: session, error: sErr } = await admin
    .from('game_sessions')
    .insert({
      game_id: gameId,
      join_code: joinCode,
      status: 'active',
      current_question_index: 0,
      question_started_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      created_by: userId,
    })
    .select('id')
    .single();
  if (sErr) throw new Error(sErr.message);

  // Auto-join as player
  await admin.from('game_players').insert({
    session_id: session.id,
    user_id: userId,
    display_name: displayName,
  });

  // Get first question (without correct_answer for client)
  const { data: question } = await admin
    .from('game_questions')
    .select('id, sort_order, type, content, options, points')
    .eq('game_id', gameId)
    .eq('sort_order', 0)
    .single();

  const { count } = await admin
    .from('game_questions')
    .select('id', { count: 'exact', head: true })
    .eq('game_id', gameId);

  return {
    sessionId: session.id,
    question: question
      ? { ...question, totalQuestions: count ?? 0, questionStartedAt: new Date().toISOString() }
      : null,
    totalQuestions: count ?? 0,
    timePerQuestion: game.time_per_question,
  };
}

export async function soloNextQuestion(sessionId: string, userId: string) {
  const admin = createAdminClient();

  const { data: session } = await admin
    .from('game_sessions')
    .select('id, game_id, current_question_index, created_by')
    .eq('id', sessionId)
    .single();
  if (!session) throw new Error('Phiên không tồn tại');
  if (session.created_by !== userId) throw new Error('Không có quyền');

  const nextIndex = session.current_question_index + 1;

  const { count } = await admin
    .from('game_questions')
    .select('id', { count: 'exact', head: true })
    .eq('game_id', session.game_id);

  if (nextIndex >= (count ?? 0)) {
    // Finish
    await admin
      .from('game_sessions')
      .update({ status: 'finished', finished_at: new Date().toISOString() })
      .eq('id', sessionId);
    return { finished: true, question: null, totalQuestions: count ?? 0 };
  }

  const now = new Date().toISOString();
  await admin
    .from('game_sessions')
    .update({ current_question_index: nextIndex, question_started_at: now })
    .eq('id', sessionId);

  const { data: question } = await admin
    .from('game_questions')
    .select('id, sort_order, type, content, options, points')
    .eq('game_id', session.game_id)
    .eq('sort_order', nextIndex)
    .single();

  return {
    finished: false,
    question: question
      ? { ...question, totalQuestions: count ?? 0, questionStartedAt: now }
      : null,
    totalQuestions: count ?? 0,
  };
}
