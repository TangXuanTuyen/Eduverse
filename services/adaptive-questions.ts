import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

export type AdaptiveConfig = {
  studentId: string;
  skillTags?: string[];
  count: number;
  mode: 'adaptive' | 'review_only' | 'random';
  excludeQuestionIds?: string[];
};

export type SelectedQuestion = {
  id: string;
  sourceQuestionId: string;
  type: string;
  content: string;
  options: unknown;
  skillTags: string[];
  difficulty: number;
  fromReview: boolean;
  reviewId?: string;
};

export async function getStudentDifficulty(
  studentId: string,
  skillTags?: string[],
): Promise<{ difficulty: number; consecutiveCorrect: number; consecutiveWrong: number }> {
  const admin = createAdminClient();

  const { data: responses } = await admin
    .from('game_responses')
    .select('is_correct, game_players!inner(user_id)')
    .eq('game_players.user_id', studentId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (!responses || responses.length === 0) {
    return { difficulty: 1, consecutiveCorrect: 0, consecutiveWrong: 0 };
  }

  let consecutiveCorrect = 0;
  let consecutiveWrong = 0;
  for (const r of responses) {
    if (r.is_correct) {
      if (consecutiveWrong > 0) break;
      consecutiveCorrect++;
    } else {
      if (consecutiveCorrect > 0) break;
      consecutiveWrong++;
    }
  }

  let difficulty = 1;
  if (consecutiveCorrect >= 3) difficulty = Math.min(3, 2);
  if (consecutiveCorrect >= 6) difficulty = 3;
  if (consecutiveWrong >= 2) difficulty = 1;

  return { difficulty, consecutiveCorrect, consecutiveWrong };
}

export async function selectQuestions(config: AdaptiveConfig): Promise<SelectedQuestion[]> {
  const { studentId, skillTags, count, mode, excludeQuestionIds = [] } = config;
  const admin = createAdminClient();
  const result: SelectedQuestion[] = [];

  // 1. Pull due review items first (unless random mode)
  if (mode !== 'random') {
    let query = admin
      .from('review_queue')
      .select('*')
      .eq('student_id', studentId)
      .lte('next_review_at', new Date().toISOString())
      .order('next_review_at', { ascending: true })
      .limit(count);

    if (skillTags && skillTags.length > 0) {
      query = query.overlaps('skill_tags', skillTags);
    }
    if (excludeQuestionIds.length > 0) {
      query = query.not('source_question_id', 'in', `(${excludeQuestionIds.join(',')})`);
    }

    const { data: reviews } = await query;
    if (reviews) {
      for (const r of reviews) {
        result.push({
          id: r.id,
          sourceQuestionId: r.source_question_id,
          type: r.question_type,
          content: r.question_content,
          options: r.question_options,
          skillTags: r.skill_tags,
          difficulty: r.difficulty,
          fromReview: true,
          reviewId: r.id,
        });
      }
    }
  }

  if (result.length >= count) return result.slice(0, count);

  // 2. For review_only mode, return what we have
  if (mode === 'review_only') return result;

  // 3. Fill from questions table with adaptive difficulty
  const remaining = count - result.length;
  const usedIds = [
    ...excludeQuestionIds,
    ...result.map((r) => r.sourceQuestionId),
  ];

  const { difficulty } = mode === 'adaptive'
    ? await getStudentDifficulty(studentId, skillTags)
    : { difficulty: 0 };

  let qQuery = admin
    .from('questions')
    .select('id, type, content, options, skill_tags, difficulty, explanation');

  if (skillTags && skillTags.length > 0) {
    qQuery = qQuery.overlaps('skill_tags', skillTags);
  }
  if (usedIds.length > 0) {
    qQuery = qQuery.not('id', 'in', `(${usedIds.join(',')})`);
  }

  if (mode === 'adaptive' && difficulty > 0) {
    // Prefer target difficulty, but also get adjacent
    qQuery = qQuery.gte('difficulty', Math.max(1, difficulty - 1))
      .lte('difficulty', Math.min(3, difficulty + 1))
      .order('difficulty', { ascending: difficulty <= 1 });
  }

  qQuery = qQuery.limit(remaining * 2); // fetch extra to allow shuffling

  const { data: questions } = await qQuery;
  if (questions) {
    // Sort: prefer target difficulty
    const sorted = mode === 'adaptive'
      ? questions.sort((a, b) => Math.abs(a.difficulty - difficulty) - Math.abs(b.difficulty - difficulty))
      : questions.sort(() => Math.random() - 0.5);

    for (const q of sorted.slice(0, remaining)) {
      result.push({
        id: q.id,
        sourceQuestionId: q.id,
        type: q.type,
        content: q.content,
        options: q.options,
        skillTags: q.skill_tags,
        difficulty: q.difficulty,
        fromReview: false,
      });
    }
  }

  return result;
}

export async function gradeAnswer(
  questionId: string,
  studentAnswer: unknown,
): Promise<{ isCorrect: boolean; explanation: string; hint?: string }> {
  const admin = createAdminClient();

  const { data: qa } = await admin
    .from('question_answers')
    .select('correct_answer')
    .eq('question_id', questionId)
    .single();

  if (!qa) {
    return { isCorrect: false, explanation: 'Không tìm thấy đáp án.' };
  }

  const { data: question } = await admin
    .from('questions')
    .select('type, explanation')
    .eq('id', questionId)
    .single();

  const explanation = question?.explanation ?? '';
  const correct = qa.correct_answer;

  const isCorrect = compareAnswers(question?.type ?? '', studentAnswer, correct);

  return { isCorrect, explanation };
}

export function compareAnswers(type: string, studentAnswer: unknown, correct: unknown): boolean {
  switch (type) {
    case 'single_choice':
      return studentAnswer === correct;
    case 'multiple_choice':
      if (Array.isArray(studentAnswer) && Array.isArray(correct)) {
        const sa = [...studentAnswer].sort();
        const ca = [...(correct as string[])].sort();
        return sa.length === ca.length && sa.every((v, i) => v === ca[i]);
      }
      return false;
    case 'short_answer':
      if (Array.isArray(correct)) {
        const ans = String(studentAnswer).trim().toLowerCase();
        return (correct as string[]).some((c) => c.trim().toLowerCase() === ans);
      }
      return false;
    case 'ordering':
      if (Array.isArray(studentAnswer) && Array.isArray(correct)) {
        return (
          studentAnswer.length === (correct as string[]).length &&
          (studentAnswer as string[]).every((v, i) => v === (correct as string[])[i])
        );
      }
      return false;
    case 'matching':
      if (typeof studentAnswer === 'object' && typeof correct === 'object' && studentAnswer && correct) {
        const sa = studentAnswer as Record<string, string>;
        const ca = correct as Record<string, string>;
        const keys = Object.keys(ca);
        return keys.length === Object.keys(sa).length && keys.every((k) => sa[k] === ca[k]);
      }
      return false;
    case 'classification':
      if (typeof studentAnswer === 'object' && typeof correct === 'object' && studentAnswer && correct) {
        const sa = studentAnswer as Record<string, string[]>;
        const ca = correct as Record<string, string[]>;
        const keys = Object.keys(ca);
        return keys.length === Object.keys(sa).length && keys.every((k) => {
          const sSet = new Set(sa[k] ?? []);
          const cSet = new Set(ca[k] ?? []);
          return sSet.size === cSet.size && [...cSet].every((v) => sSet.has(v));
        });
      }
      return false;
    default:
      return JSON.stringify(studentAnswer) === JSON.stringify(correct);
  }
}
