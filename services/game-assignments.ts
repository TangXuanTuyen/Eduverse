import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { addToReviewQueue } from '@/services/review-queue';
import { awardXp } from '@/services/xp';

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
  // Không có người chơi thì mọi câu trả lời đều lỗi "Chưa tham gia" → báo lỗi ngay
  const { error: pErr } = await admin.from('game_players').insert({
    session_id: session.id,
    user_id: userId,
    display_name: displayName.trim().slice(0, 50) || 'Học sinh',
  });
  if (pErr) throw new Error(pErr.message);

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


/**
 * Ghi nhận một câu học sinh vừa trả lời trong trò chơi Mê cung (bài giao dạng trò chơi).
 * Máy chủ tự chấm theo đáp án của bài giao; câu sai được đưa vào Trạm Sửa Lỗi của học sinh.
 */
export async function recordMazeAnswer(
  studentId: string,
  assignmentId: string,
  questionId: string,
  selectedIndex: number,
): Promise<{ isCorrect: boolean }> {
  const admin = createAdminClient();

  const { data: assignment } = await admin
    .from('assignments')
    .select('id, room_id')
    .eq('id', assignmentId)
    .single();
  if (!assignment) throw new Error('Không tìm thấy bài tập');

  const { data: member } = await admin
    .from('room_members')
    .select('room_id')
    .eq('room_id', assignment.room_id)
    .eq('user_id', studentId)
    .eq('is_active', true)
    .maybeSingle();
  if (!member) throw new Error('Bạn không thuộc lớp này');

  const { data: aq } = await admin
    .from('assignment_questions')
    .select('id, options, correct_answer, source_question_id')
    .eq('id', questionId)
    .eq('assignment_id', assignmentId)
    .single();
  if (!aq) throw new Error('Không tìm thấy câu hỏi');

  const options = Array.isArray(aq.options) ? (aq.options as { id?: string; text?: string }[]) : [];
  const chosen = options[selectedIndex];
  if (!chosen) throw new Error('Đáp án không hợp lệ');

  const correct = aq.correct_answer;
  const isCorrect =
    typeof correct === 'number'
      ? correct === selectedIndex
      : correct === chosen.id || correct === chosen.text;

  // Nhật ký: câu trả lời đầu tiên của mỗi câu được tính (chơi lại không đổi kết quả)
  await admin.from('game_answer_log').upsert(
    {
      assignment_id: assignmentId,
      student_id: studentId,
      question_id: questionId,
      is_correct: isCorrect,
    },
    { onConflict: 'assignment_id,student_id,question_id', ignoreDuplicates: true },
  );

  if (!isCorrect && aq.source_question_id) {
    await addToReviewQueue(studentId, aq.source_question_id as string);
  }
  return { isCorrect };
}

export type GameCompleteResult = {
  completed: boolean;
  already?: boolean;
  correct: number;
  answered: number;
  total: number;
  xp: number;
  message?: string;
};

/**
 * Học sinh báo đã chơi hết trận của bài giao trò chơi. Máy chủ không tin trình duyệt:
 * chỉ tính hoàn thành khi nhật ký có đủ ít nhất một nửa số câu trắc nghiệm 4 đáp án của bài giao.
 */
export async function completeGameAssignment(
  studentId: string,
  assignmentId: string,
): Promise<GameCompleteResult> {
  const admin = createAdminClient();

  const { data: assignment } = await admin
    .from('assignments')
    .select('id, room_id, assignment_type')
    .eq('id', assignmentId)
    .single();
  if (!assignment || assignment.assignment_type !== 'game') throw new Error('Không tìm thấy bài giao trò chơi');

  const { data: member } = await admin
    .from('room_members')
    .select('room_id')
    .eq('room_id', assignment.room_id)
    .eq('user_id', studentId)
    .eq('is_active', true)
    .maybeSingle();
  if (!member) throw new Error('Bạn không thuộc lớp này');

  const { data: qs } = await admin
    .from('assignment_questions')
    .select('id, options')
    .eq('assignment_id', assignmentId);
  const eligible = (qs ?? []).filter((q) => Array.isArray(q.options) && q.options.length === 4);
  const total = eligible.length;

  const { data: log } = await admin
    .from('game_answer_log')
    .select('question_id, is_correct')
    .eq('assignment_id', assignmentId)
    .eq('student_id', studentId);
  const eligibleIds = new Set(eligible.map((q) => q.id as string));
  const rows = (log ?? []).filter((r) => eligibleIds.has(r.question_id as string));
  const answered = rows.length;
  const correct = rows.filter((r) => r.is_correct).length;

  const needed = Math.max(1, Math.ceil(total / 2));
  if (total === 0 || answered < needed) {
    return {
      completed: false,
      correct,
      answered,
      total,
      xp: 0,
      message: `Em mới trả lời ${answered}/${total} câu. Cần trả lời ít nhất ${needed} câu để tính hoàn thành, em chơi lại nhé.`,
    };
  }

  const { error: insErr } = await admin
    .from('task_completions')
    .insert({ assignment_id: assignmentId, student_id: studentId });
  if (insErr) {
    if (insErr.code === '23505') return { completed: true, already: true, correct, answered, total, xp: 0 };
    throw new Error(insErr.message);
  }

  let xp = 0;
  try {
    const r = await awardXp(studentId, 'game_complete', `game-assign:${assignmentId}:${studentId}`);
    xp = r.awarded;
  } catch {
    /* XP lỗi không chặn hoàn thành */
  }
  return { completed: true, correct, answered, total, xp };
}
