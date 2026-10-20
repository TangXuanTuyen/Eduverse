import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { addToReviewQueue } from '@/services/review-queue';

export type GameSessionRow = {
  id: string;
  game_id: string;
  room_id: string | null;
  join_code: string;
  status: 'waiting' | 'active' | 'finished';
  current_question_index: number;
  question_started_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_by: string;
  created_at: string;
};

export type GamePlayerRow = {
  id: string;
  session_id: string;
  user_id: string;
  display_name: string;
  total_score: number;
  current_streak: number;
  joined_at: string;
};

export type LeaderboardEntry = {
  display_name: string;
  total_score: number;
  user_id: string;
};

export async function startSession(gameId: string, teacherId: string, roomId?: string) {
  const admin = createAdminClient();

  // Verify ownership
  const { data: game, error: gErr } = await admin
    .from('games')
    .select('id, status')
    .eq('id', gameId)
    .eq('owner_id', teacherId)
    .single();
  if (gErr || !game) throw new Error('Không tìm thấy trò chơi');

  // Generate join code
  const { data: codeResult } = await admin.rpc('generate_game_join_code');
  const joinCode = codeResult as string;

  const { data: session, error } = await admin
    .from('game_sessions')
    .insert({
      game_id: gameId,
      room_id: roomId ?? null,
      join_code: joinCode,
      status: 'waiting',
      current_question_index: -1,
      created_by: teacherId,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  // Update game status
  await admin.from('games').update({ status: 'live' }).eq('id', gameId);

  return session as GameSessionRow;
}

export async function joinSession(joinCode: string, userId: string, displayName: string) {
  const admin = createAdminClient();

  const { data: session, error: sErr } = await admin
    .from('game_sessions')
    .select('id, status')
    .eq('join_code', joinCode.toUpperCase())
    .single();
  if (sErr || !session) throw new Error('Mã trò chơi không hợp lệ');
  if (session.status === 'finished') throw new Error('Trò chơi đã kết thúc');

  // Upsert player
  const { data: player, error: pErr } = await admin
    .from('game_players')
    .upsert(
      { session_id: session.id, user_id: userId, display_name: displayName },
      { onConflict: 'session_id,user_id' }
    )
    .select('*')
    .single();
  if (pErr) throw new Error(pErr.message);

  // Broadcast player joined
  await admin.channel(`game:${session.id}`).send({
    type: 'broadcast',
    event: 'player_joined',
    payload: { display_name: displayName, total_score: 0 },
  });

  return { sessionId: session.id, player: player as GamePlayerRow };
}

export async function getSessionPlayers(sessionId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('game_players')
    .select('*')
    .eq('session_id', sessionId)
    .order('total_score', { ascending: false });
  if (error) throw new Error(error.message);
  return data as GamePlayerRow[];
}

export async function getSessionQuestion(sessionId: string) {
  const admin = createAdminClient();

  const { data: session } = await admin
    .from('game_sessions')
    .select('id, game_id, current_question_index, question_started_at, status')
    .eq('id', sessionId)
    .single();
  if (!session) throw new Error('Phiên không tồn tại');
  if (session.current_question_index < 0) return null;

  const { data: question } = await admin
    .from('game_questions')
    .select('id, sort_order, type, content, options, points')
    .eq('game_id', session.game_id)
    .eq('sort_order', session.current_question_index)
    .single();

  if (!question) return null;

  // Get total question count
  const { count } = await admin
    .from('game_questions')
    .select('id', { count: 'exact', head: true })
    .eq('game_id', session.game_id);

  return {
    ...question,
    questionStartedAt: session.question_started_at,
    totalQuestions: count ?? 0,
  };
}

export async function advanceQuestion(sessionId: string, teacherId: string) {
  const admin = createAdminClient();

  // Verify ownership
  const { data: session } = await admin
    .from('game_sessions')
    .select('id, game_id, current_question_index, status')
    .eq('id', sessionId)
    .single();
  if (!session) throw new Error('Phiên không tồn tại');

  const { data: game } = await admin
    .from('games')
    .select('owner_id')
    .eq('id', session.game_id)
    .single();
  if (!game || game.owner_id !== teacherId) throw new Error('Không có quyền');

  const nextIndex = session.current_question_index + 1;

  // Check if there are more questions
  const { count } = await admin
    .from('game_questions')
    .select('id', { count: 'exact', head: true })
    .eq('game_id', session.game_id);

  if (nextIndex >= (count ?? 0)) {
    return { finished: true };
  }

  const now = new Date().toISOString();
  await admin
    .from('game_sessions')
    .update({
      current_question_index: nextIndex,
      question_started_at: now,
      status: 'active',
      ...(nextIndex === 0 ? { started_at: now } : {}),
    })
    .eq('id', sessionId);

  // Get question for broadcast (without correct_answer)
  const { data: question } = await admin
    .from('game_questions')
    .select('id, sort_order, type, content, options, points')
    .eq('game_id', session.game_id)
    .eq('sort_order', nextIndex)
    .single();

  // Get game time setting
  const { data: gameSetting } = await admin
    .from('games')
    .select('time_per_question')
    .eq('id', session.game_id)
    .single();

  const tl = gameSetting?.time_per_question ?? 30;

  // Broadcast question to students via Realtime
  if (question) {
    await admin.channel(`game:${sessionId}`).send({
      type: 'broadcast',
      event: 'question_start',
      payload: {
        index: nextIndex,
        questionId: question.id,
        content: question.content,
        options: question.options,
        type: question.type,
        points: question.points,
        timeLimit: tl,
        totalQuestions: count ?? 0,
      },
    });
  }

  return {
    finished: false,
    question,
    timeLimit: tl,
    questionIndex: nextIndex,
    totalQuestions: count ?? 0,
  };
}

export async function submitAnswer(
  sessionId: string,
  userId: string,
  questionId: string,
  answer: unknown
) {
  const admin = createAdminClient();

  // Get player
  const { data: player } = await admin
    .from('game_players')
    .select('id, current_streak, total_score')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .single();
  if (!player) throw new Error('Chưa tham gia trò chơi');

  // Check not already answered
  const { data: existing } = await admin
    .from('game_responses')
    .select('id')
    .eq('player_id', player.id)
    .eq('question_id', questionId)
    .maybeSingle();
  if (existing) throw new Error('Đã trả lời câu này');

  // Get question with correct_answer
  const { data: question } = await admin
    .from('game_questions')
    .select('id, type, correct_answer, points, source_question_id')
    .eq('id', questionId)
    .single();
  if (!question) throw new Error('Câu hỏi không tồn tại');

  // Get session for timing
  const { data: session } = await admin
    .from('game_sessions')
    .select('question_started_at')
    .eq('id', sessionId)
    .single();

  const timeMs = session?.question_started_at
    ? Date.now() - new Date(session.question_started_at).getTime()
    : 0;

  // Grade (same logic as submissions.ts)
  let isCorrect: boolean | null = null;
  let score = 0;
  const correct = question.correct_answer;
  const type = question.type as string;

  if (type === 'single_choice') {
    isCorrect = JSON.stringify(answer) === JSON.stringify(correct);
  } else if (type === 'multiple_choice') {
    const s = Array.isArray(answer) ? [...answer].sort() : [];
    const c = Array.isArray(correct) ? [...correct].sort() : [];
    isCorrect = JSON.stringify(s) === JSON.stringify(c);
  } else if (type === 'short_answer') {
    const normalize = (v: unknown) => String(v ?? '').trim().toLowerCase();
    const accepted = Array.isArray(correct) ? correct.map(normalize) : [normalize(correct)];
    isCorrect = accepted.includes(normalize(answer));
  }

  if (isCorrect) {
    // Speed bonus: faster = more points (max 2x)
    const { data: gameSetting } = await admin
      .from('games')
      .select('time_per_question, points_per_question')
      .eq('id', (await admin.from('game_sessions').select('game_id').eq('id', sessionId).single()).data?.game_id)
      .single();
    const maxTime = (gameSetting?.time_per_question ?? 30) * 1000;
    const basePoints = gameSetting?.points_per_question ?? question.points;
    const speedMultiplier = Math.max(0.5, 1 - timeMs / maxTime) + 0.5;
    score = Math.round(basePoints * speedMultiplier);
  }

  // Insert response
  await admin.from('game_responses').insert({
    session_id: sessionId,
    player_id: player.id,
    question_id: questionId,
    answer,
    is_correct: isCorrect,
    time_ms: timeMs,
    score,
  });

  // Add wrong answers to review queue for spaced repetition
  if (!isCorrect && question.source_question_id) {
    addToReviewQueue(userId, question.source_question_id, sessionId).catch(() => {});
  }

  // Update player score + streak
  const newStreak = isCorrect ? player.current_streak + 1 : 0;
  await admin
    .from('game_players')
    .update({
      total_score: player.total_score + score,
      current_streak: newStreak,
    })
    .eq('id', player.id);

  // Broadcast answer count to teacher
  const { count: answerCount } = await admin
    .from('game_responses')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .eq('question_id', questionId);
  await admin.channel(`game:${sessionId}`).send({
    type: 'broadcast',
    event: 'answer_received',
    payload: { count: answerCount ?? 0 },
  });

  return { isCorrect, score, streak: newStreak, timeMs };
}

export async function getQuestionResults(sessionId: string, questionId: string) {
  const admin = createAdminClient();

  const { data: responses } = await admin
    .from('game_responses')
    .select('is_correct, answer, time_ms, score, game_players!inner(display_name)')
    .eq('session_id', sessionId)
    .eq('question_id', questionId);

  const { data: question } = await admin
    .from('game_questions')
    .select('correct_answer, explanation')
    .eq('id', questionId)
    .single();

  const total = (responses ?? []).length;
  const correct = (responses ?? []).filter((r: Record<string, unknown>) => r.is_correct).length;

  // Get leaderboard for broadcast
  const players = await getSessionPlayers(sessionId);
  const top5 = players.slice(0, 5).map((p) => ({
    display_name: p.display_name,
    total_score: p.total_score,
    user_id: p.user_id,
  }));

  // Broadcast question_end to students
  await admin.channel(`game:${sessionId}`).send({
    type: 'broadcast',
    event: 'question_end',
    payload: { leaderboard: top5 },
  });

  return {
    correctAnswer: question?.correct_answer,
    explanation: question?.explanation ?? '',
    total,
    correct,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
  };
}

export async function endSession(sessionId: string, teacherId: string) {
  const admin = createAdminClient();

  const { data: session } = await admin
    .from('game_sessions')
    .select('id, game_id')
    .eq('id', sessionId)
    .single();
  if (!session) throw new Error('Phiên không tồn tại');

  const { data: game } = await admin
    .from('games')
    .select('owner_id')
    .eq('id', session.game_id)
    .single();
  if (!game || game.owner_id !== teacherId) throw new Error('Không có quyền');

  await admin
    .from('game_sessions')
    .update({ status: 'finished', finished_at: new Date().toISOString() })
    .eq('id', sessionId);

  await admin
    .from('games')
    .update({ status: 'finished' })
    .eq('id', session.game_id);

  // Broadcast game_end with final leaderboard
  const finalPlayers = await getSessionPlayers(sessionId);
  await admin.channel(`game:${sessionId}`).send({
    type: 'broadcast',
    event: 'game_end',
    payload: {
      finalLeaderboard: finalPlayers.map((p) => ({
        display_name: p.display_name,
        total_score: p.total_score,
        user_id: p.user_id,
      })),
    },
  });
}

export async function getLeaderboard(sessionId: string): Promise<LeaderboardEntry[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('game_players')
    .select('display_name, total_score, user_id')
    .eq('session_id', sessionId)
    .order('total_score', { ascending: false })
    .limit(10);
  if (error) throw new Error(error.message);
  return data as LeaderboardEntry[];
}

export async function getSessionForTeacher(sessionId: string, teacherId: string) {
  const admin = createAdminClient();
  const { data: session } = await admin
    .from('game_sessions')
    .select('*, games!inner(owner_id, name, time_per_question, points_per_question, mode)')
    .eq('id', sessionId)
    .single();

  if (!session) throw new Error('Phiên không tồn tại');
  const games = session.games as unknown as { owner_id: string };
  if (games.owner_id !== teacherId) throw new Error('Không có quyền');

  return session;
}
