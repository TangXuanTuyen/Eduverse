import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

export type GameRow = {
  id: string;
  owner_id: string;
  question_set_id: string;
  name: string;
  mode: 'tu_luyen' | 'thi_dau';
  time_per_question: number;
  points_per_question: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  level_progression: boolean;
  status: 'draft' | 'ready' | 'live' | 'finished';
  created_at: string;
  updated_at: string;
  question_count?: number;
};

export type GameQuestionRow = {
  id: string;
  sort_order: number;
  type: string;
  content: string;
  options: { id: string; text: string }[] | null;
  correct_answer: unknown;
  explanation: string;
  points: number;
};

export type CreateGameData = {
  question_set_id: string;
  name: string;
  mode: 'tu_luyen' | 'thi_dau';
  time_per_question?: number;
  points_per_question?: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  level_progression?: boolean;
};

export async function getTeacherGames(teacherId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('games')
    .select('*, game_questions(count)')
    .eq('owner_id', teacherId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map((g: Record<string, unknown>) => {
    const items = g.game_questions as unknown;
    const count = Array.isArray(items) && items.length > 0
      ? (items[0] as { count: number }).count
      : 0;
    return { ...g, question_count: count } as GameRow;
  });
}

export async function getGameForEdit(gameId: string, teacherId: string) {
  const admin = createAdminClient();
  const { data: game, error } = await admin
    .from('games')
    .select('*')
    .eq('id', gameId)
    .eq('owner_id', teacherId)
    .single();
  if (error) throw new Error('Không tìm thấy trò chơi');

  const { data: questions } = await admin
    .from('game_questions')
    .select('id, sort_order, type, content, options, explanation, points')
    .eq('game_id', gameId)
    .order('sort_order');

  return {
    game: game as GameRow,
    questions: (questions ?? []) as Omit<GameQuestionRow, 'correct_answer'>[],
  };
}

export async function createGame(teacherId: string, data: CreateGameData) {
  const admin = createAdminClient();

  // Get question IDs from set
  const { data: items, error: itemErr } = await admin
    .from('question_set_items')
    .select('question_id, sort_order')
    .eq('set_id', data.question_set_id)
    .order('sort_order');
  if (itemErr) throw new Error(itemErr.message);
  if (!items || items.length === 0) throw new Error('Bộ đề trống');

  const questionIds = items.map((i: { question_id: string }) => i.question_id);

  // Create game
  const { data: game, error: gErr } = await admin
    .from('games')
    .insert({
      owner_id: teacherId,
      question_set_id: data.question_set_id,
      name: data.name,
      mode: data.mode,
      time_per_question: data.time_per_question ?? 30,
      points_per_question: data.points_per_question ?? 100,
      shuffle_questions: data.shuffle_questions ?? false,
      shuffle_options: data.shuffle_options ?? false,
      level_progression: data.level_progression ?? false,
      status: 'ready',
    })
    .select('id')
    .single();
  if (gErr) throw new Error(gErr.message);

  // Snapshot questions + answers (giống createAssignment)
  const { data: questions } = await admin
    .from('questions')
    .select('id, type, content, options, explanation')
    .in('id', questionIds);

  const questionMap = new Map((questions ?? []).map((q: Record<string, unknown>) => [q.id, q]));

  const { data: answers } = await admin
    .from('question_answers')
    .select('question_id, correct_answer')
    .in('question_id', questionIds);
  const answerMap = new Map((answers ?? []).map((a: Record<string, unknown>) => [a.question_id, a.correct_answer]));

  const pointsPerQ = data.points_per_question ?? 100;
  const snapshots = items
    .map((item: { question_id: string; sort_order: number }) => {
      const q = questionMap.get(item.question_id);
      if (!q) return null;
      const qr = q as Record<string, unknown>;
      return {
        game_id: game.id,
        source_question_id: item.question_id,
        sort_order: item.sort_order,
        type: qr.type,
        content: qr.content,
        options: qr.options ?? null,
        correct_answer: answerMap.get(item.question_id) ?? null,
        explanation: qr.explanation ?? '',
        points: pointsPerQ,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s != null);

  if (snapshots.length > 0) {
    const { error: snapErr } = await admin.from('game_questions').insert(snapshots as Record<string, unknown>[]);
    if (snapErr) throw new Error(snapErr.message);
  }

  return game.id as string;
}

export async function deleteGame(gameId: string, teacherId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('games')
    .delete()
    .eq('id', gameId)
    .eq('owner_id', teacherId);
  if (error) throw new Error(error.message);
}
