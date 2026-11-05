import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import type { QuestionBlock } from '@/lib/lessons/schema';

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

  // Đếm số lần sai cộng dồn, không để về 1 mỗi lần làm sai lại
  const { data: existing } = await admin
    .from('review_queue')
    .select('wrong_count')
    .eq('student_id', studentId)
    .eq('source_question_id', sourceQuestionId)
    .maybeSingle();

  const { error } = await admin.from('review_queue').upsert(
    {
      student_id: studentId,
      source_question_id: sourceQuestionId,
      question_content: q.content,
      question_options: q.options,
      question_type: q.type,
      explanation: q.explanation ?? '',
      skill_tags: q.skill_tags ?? [],
      difficulty: q.difficulty,
      wrong_count: (existing?.wrong_count ?? 0) + 1,
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
  if (error) console.error('[review-queue] addToReviewQueue:', error.message);
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

  const { data: item } = await admin
    .from('review_queue')
    .select('wrong_count')
    .eq('id', reviewId)
    .eq('student_id', studentId)
    .maybeSingle();

  await admin
    .from('review_queue')
    .update({
      interval_days: 1,
      correct_streak: 0,
      wrong_count: (item?.wrong_count ?? 0) + 1,
      next_review_at: nextDate.toISOString(),
      last_reviewed_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .eq('student_id', studentId);
}

export type ReviewItem = {
  id: string;
  sourceQuestionId: string | null;
  sourceLessonId: string | null;
  sourceBlockKey: string | null;
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
    sourceLessonId: r.source_lesson_id,
    sourceBlockKey: r.source_block_key,
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

/** Lấy một dòng ôn tập của đúng học sinh đó, hoặc null nếu không phải của họ. */
export async function getReviewItemForStudent(
  reviewId: string,
  studentId: string,
): Promise<ReviewItem | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('review_queue')
    .select('*')
    .eq('id', reviewId)
    .eq('student_id', studentId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    sourceQuestionId: data.source_question_id,
    sourceLessonId: data.source_lesson_id,
    sourceBlockKey: data.source_block_key,
    questionContent: data.question_content,
    questionOptions: data.question_options,
    questionType: data.question_type,
    explanation: data.explanation,
    skillTags: data.skill_tags,
    difficulty: data.difficulty,
    wrongCount: data.wrong_count,
    intervalDays: data.interval_days,
    nextReviewAt: data.next_review_at,
  };
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

/** Đưa một câu trắc nghiệm trong bài học vào Trạm Sửa Lỗi của học sinh, nếu chưa có. */
export async function addLessonReviewItem(
  studentId: string,
  lessonId: string,
  stepIndex: number,
  blockIndex: number,
  block: QuestionBlock,
): Promise<void> {
  const admin = createAdminClient();
  const blockKey = `${stepIndex}:${blockIndex}`;

  const { data: existing } = await admin
    .from('review_queue')
    .select('id, wrong_count')
    .eq('student_id', studentId)
    .eq('source_lesson_id', lessonId)
    .eq('source_block_key', blockKey)
    .maybeSingle();

  const row = {
    student_id: studentId,
    source_lesson_id: lessonId,
    source_block_key: blockKey,
    question_content: block.content,
    question_options: block.options ?? null,
    question_type: block.questionType,
    explanation: block.explanation ?? '',
    skill_tags: [],
    difficulty: 1,
    wrong_count: (existing?.wrong_count ?? 0) + 1,
    interval_days: 1,
    next_review_at: new Date().toISOString(),
    correct_streak: 0,
  };

  const { error } = existing
    ? await admin.from('review_queue').update(row).eq('id', existing.id)
    : await admin.from('review_queue').insert(row);
  if (error) console.error('[review-queue] addLessonReviewItem:', error.message);
}

export type ReviewQueueItem = ReviewItem & {
  isDue: boolean;
  source: 'lesson' | 'bank';
  lessonTitle: string | null;
  chapter: string | null;
};

/** Toàn bộ hàng đợi của học sinh, kèm tên bài và chương để nhóm theo bài. */
export async function getReviewQueue(studentId: string, limit = 200): Promise<ReviewQueueItem[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('review_queue')
    .select('*')
    .eq('student_id', studentId)
    .order('next_review_at', { ascending: true })
    .limit(limit);

  const rows = data ?? [];
  const lessonIds = [...new Set(rows.map((r) => r.source_lesson_id).filter((v): v is string => !!v))];
  const lessons = new Map<string, { title: string; chapter: string | null }>();
  if (lessonIds.length > 0) {
    const { data: lessonRows } = await admin
      .from('lessons')
      .select('id, title, chapter')
      .in('id', lessonIds);
    for (const l of lessonRows ?? []) {
      lessons.set(l.id, { title: l.title, chapter: l.chapter ?? null });
    }
  }

  const now = Date.now();
  return rows.map((r) => {
    const lesson = r.source_lesson_id ? lessons.get(r.source_lesson_id) : undefined;
    return {
      id: r.id,
      sourceQuestionId: r.source_question_id,
      sourceLessonId: r.source_lesson_id,
      sourceBlockKey: r.source_block_key,
      questionContent: r.question_content,
      questionOptions: r.question_options,
      questionType: r.question_type,
      explanation: r.explanation,
      skillTags: r.skill_tags,
      difficulty: r.difficulty,
      wrongCount: r.wrong_count,
      intervalDays: r.interval_days,
      nextReviewAt: r.next_review_at,
      isDue: new Date(r.next_review_at).getTime() <= now,
      source: r.source_lesson_id ? 'lesson' : 'bank',
      lessonTitle: lesson?.title ?? null,
      chapter: lesson?.chapter ?? null,
    };
  });
}
