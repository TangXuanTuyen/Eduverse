import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

const INTERVALS = [1, 3, 7, 14, 30] as const;

function nextInterval(current: number): number | null {
  const idx = INTERVALS.indexOf(current as (typeof INTERVALS)[number]);
  if (idx === -1) return INTERVALS[0];
  if (idx >= INTERVALS.length - 1) return null; // mastered
  return INTERVALS[idx + 1];
}

export async function addToReviewQueue(
  studentId: string,
  sourceQuestionId: string,
  sourceSessionId?: string,
  sourceResponseId?: string,
): Promise<void> {
  const admin = createAdminClient();

  // Fetch question snapshot data
  const { data: q } = await admin
    .from('questions')
    .select('content, options, type, explanation, skill_tags, difficulty')
    .eq('id', sourceQuestionId)
    .single();

  if (!q) return;

  await admin.from('review_queue').upsert(
    {
      student_id: studentId,
      source_question_id: sourceQuestionId,
      question_content: q.content,
      question_options: q.options,
      question_type: q.type,
      explanation: q.explanation ?? '',
      skill_tags: q.skill_tags ?? [],
      difficulty: q.difficulty,
      interval_days: 1,
      next_review_at: new Date().toISOString(),
      correct_streak: 0,
      source_session_id: sourceSessionId ?? null,
      source_response_id: sourceResponseId ?? null,
    },
    {
      onConflict: 'student_id,source_question_id',
      ignoreDuplicates: false,
    },
  );

  // The upsert above handles insert. For existing rows, reset interval.
  // (The upsert with ignoreDuplicates:false replaces the row, so we're done.)
}

export async function markReviewCorrect(
  reviewId: string,
  studentId: string,
): Promise<{ nextReviewAt: string | null; intervalDays: number }> {
  const admin = createAdminClient();

  const { data: item } = await admin
    .from('review_queue')
    .select('*')
    .eq('id', reviewId)
    .eq('student_id', studentId)
    .single();

  if (!item) throw new Error('Review item not found');

  const next = nextInterval(item.interval_days);

  if (next === null) {
    // Mastered — remove from queue
    await admin.from('review_queue').delete().eq('id', reviewId);
    return { nextReviewAt: null, intervalDays: 0 };
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + next);

  await admin
    .from('review_queue')
    .update({
      interval_days: next,
      correct_streak: item.correct_streak + 1,
      next_review_at: nextDate.toISOString(),
      last_reviewed_at: new Date().toISOString(),
    })
    .eq('id', reviewId);

  return { nextReviewAt: nextDate.toISOString(), intervalDays: next };
}

export async function markReviewWrong(
  reviewId: string,
  studentId: string,
): Promise<void> {
  const admin = createAdminClient();

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 1);

  await admin
    .from('review_queue')
    .update({
      interval_days: 1,
      correct_streak: 0,
      next_review_at: nextDate.toISOString(),
      last_reviewed_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .eq('student_id', studentId);
}

export type ReviewItem = {
  id: string;
  sourceQuestionId: string;
  questionContent: string;
  questionOptions: unknown;
  questionType: string;
  explanation: string;
  skillTags: string[];
  difficulty: number;
  wrongCount: number;
  intervalDays: number;
  nextReviewAt: string;
};

export async function getDueReviews(
  studentId: string,
  limit = 20,
): Promise<ReviewItem[]> {
  const admin = createAdminClient();

  const { data } = await admin
    .from('review_queue')
    .select('*')
    .eq('student_id', studentId)
    .lte('next_review_at', new Date().toISOString())
    .order('next_review_at', { ascending: true })
    .limit(limit);

  return (data ?? []).map((r) => ({
    id: r.id,
    sourceQuestionId: r.source_question_id,
    questionContent: r.question_content,
    questionOptions: r.question_options,
    questionType: r.question_type,
    explanation: r.explanation,
    skillTags: r.skill_tags,
    difficulty: r.difficulty,
    wrongCount: r.wrong_count,
    intervalDays: r.interval_days,
    nextReviewAt: r.next_review_at,
  }));
}

export async function getReviewStats(studentId: string): Promise<{
  totalItems: number;
  dueNow: number;
  masteredThisWeek: number;
}> {
  const admin = createAdminClient();

  const { count: totalItems } = await admin
    .from('review_queue')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId);

  const { count: dueNow } = await admin
    .from('review_queue')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .lte('next_review_at', new Date().toISOString());

  // Mastered this week: reviews_fixed from student_stats (approximation)
  const { data: stats } = await admin
    .from('student_stats')
    .select('reviews_fixed')
    .eq('student_id', studentId)
    .single();

  return {
    totalItems: totalItems ?? 0,
    dueNow: dueNow ?? 0,
    masteredThisWeek: stats?.reviews_fixed ?? 0,
  };
}
