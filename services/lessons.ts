import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { lessonContentSchema } from '@/lib/lessons/schema';
import type { LessonContent } from '@/lib/lessons/schema';

export type LessonRow = {
  id: string;
  title: string;
  description: string;
  subject: string;
  grade_level: number;
  chapter: string;
  sort_order: number;
  thumbnail_url: string | null;
  content: LessonContent;
  status: 'draft' | 'published' | 'archived';
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type LessonProgressRow = {
  id: string;
  user_id: string;
  lesson_id: string;
  current_step: number;
  completed_steps: number[];
  is_completed: boolean;
  score: number | null;
  started_at: string;
  completed_at: string | null;
};

// --- Admin ---

export async function getAllLessons() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('lessons')
    .select('id, title, description, subject, grade_level, chapter, status, sort_order, created_at')
    .order('sort_order')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Pick<LessonRow, 'id' | 'title' | 'description' | 'subject' | 'grade_level' | 'chapter' | 'status' | 'sort_order' | 'created_at'>[];
}

export async function getPublishedLessons(filters?: { subject?: string; grade_level?: number }) {
  const admin = createAdminClient();
  let q = admin
    .from('lessons')
    .select('id, title, description, subject, grade_level, chapter, sort_order, thumbnail_url')
    .eq('status', 'published')
    .order('sort_order');
  if (filters?.subject) q = q.eq('subject', filters.subject);
  if (filters?.grade_level) q = q.eq('grade_level', filters.grade_level);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getLessonDetail(lessonId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single();
  if (error) throw new Error('Không tìm thấy bài học');
  const lesson = data as LessonRow;
  const parsed = lessonContentSchema.safeParse(lesson.content);
  if (!parsed.success) {
    lesson.content = [] as unknown as LessonContent;
  } else {
    lesson.content = parsed.data;
  }
  return lesson;
}

export async function createLesson(data: {
  title: string;
  description?: string;
  subject: string;
  grade_level: number;
  chapter?: string;
  content: LessonContent;
  created_by: string;
}) {
  const parsed = lessonContentSchema.parse(data.content);
  const admin = createAdminClient();
  const { data: lesson, error } = await admin
    .from('lessons')
    .insert({
      title: data.title,
      description: data.description ?? '',
      subject: data.subject,
      grade_level: data.grade_level,
      chapter: data.chapter ?? '',
      content: parsed,
      status: 'draft',
      created_by: data.created_by,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return lesson.id as string;
}

export async function updateLesson(lessonId: string, data: {
  title?: string;
  description?: string;
  subject?: string;
  grade_level?: number;
  chapter?: string;
  content?: LessonContent;
  status?: 'draft' | 'published' | 'archived';
}) {
  const updates: Record<string, unknown> = {};
  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.subject !== undefined) updates.subject = data.subject;
  if (data.grade_level !== undefined) updates.grade_level = data.grade_level;
  if (data.chapter !== undefined) updates.chapter = data.chapter;
  if (data.status !== undefined) updates.status = data.status;
  if (data.content !== undefined) {
    updates.content = lessonContentSchema.parse(data.content);
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('lessons')
    .update(updates)
    .eq('id', lessonId);
  if (error) throw new Error(error.message);
}

export async function deleteLesson(lessonId: string) {
  const admin = createAdminClient();
  const { error } = await admin.from('lessons').delete().eq('id', lessonId);
  if (error) throw new Error(error.message);
}

// --- Progress ---

export async function getOrCreateProgress(userId: string, lessonId: string) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle();
  if (existing) return existing as LessonProgressRow;

  const { data, error } = await admin
    .from('lesson_progress')
    .insert({ user_id: userId, lesson_id: lessonId })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as LessonProgressRow;
}

export async function updateProgress(userId: string, lessonId: string, updates: {
  current_step?: number;
  completed_step?: number;
  is_completed?: boolean;
  score?: number;
}) {
  const admin = createAdminClient();

  const progress = await getOrCreateProgress(userId, lessonId);
  const upd: Record<string, unknown> = {};

  if (updates.current_step !== undefined) upd.current_step = updates.current_step;
  if (updates.completed_step !== undefined) {
    const steps = new Set(progress.completed_steps);
    steps.add(updates.completed_step);
    upd.completed_steps = Array.from(steps).sort((a, b) => a - b);
  }
  if (updates.is_completed) {
    upd.is_completed = true;
    upd.completed_at = new Date().toISOString();
  }
  if (updates.score !== undefined) upd.score = updates.score;

  const { error } = await admin
    .from('lesson_progress')
    .update(upd)
    .eq('id', progress.id);
  if (error) throw new Error(error.message);
}

export async function recordLessonEvent(userId: string, lessonId: string, eventType: string, stepIndex?: number, data?: Record<string, unknown>) {
  const admin = createAdminClient();
  await admin.from('lesson_events').insert({
    user_id: userId,
    lesson_id: lessonId,
    event_type: eventType,
    step_index: stepIndex ?? null,
    data: data ?? {},
  });
}

// --- Observation notes ---

export async function saveObservationNote(userId: string, lessonId: string, stepIndex: number, note: {
  prediction?: string;
  observation?: string;
  explanation?: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('observation_notes')
    .upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        step_index: stepIndex,
        ...(note.prediction !== undefined ? { prediction: note.prediction } : {}),
        ...(note.observation !== undefined ? { observation: note.observation } : {}),
        ...(note.explanation !== undefined ? { explanation: note.explanation } : {}),
      },
      { onConflict: 'user_id,lesson_id,step_index' }
    );
  if (error) throw new Error(error.message);
}

export async function getObservationNotes(userId: string, lessonId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('observation_notes')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .order('step_index');
  return data ?? [];
}

// --- Assignments ---

export async function assignLesson(teacherId: string, lessonId: string, roomId: string, dueAt?: string) {
  const admin = createAdminClient();
  const { error } = await admin.from('lesson_assignments').insert({
    lesson_id: lessonId,
    room_id: roomId,
    assigned_by: teacherId,
    due_at: dueAt ?? null,
  });
  if (error) {
    if (error.code === '23505') throw new Error('Đã giao bài này cho lớp rồi');
    throw new Error(error.message);
  }
}

export async function getStudentLessonAssignments(userId: string) {
  const admin = createAdminClient();
  const { data: memberships } = await admin
    .from('room_members')
    .select('room_id')
    .eq('user_id', userId);
  if (!memberships || memberships.length === 0) return [];

  const roomIds = memberships.map((m: { room_id: string }) => m.room_id);
  const { data, error } = await admin
    .from('lesson_assignments')
    .select('*, lessons!inner(id, title, description, subject, grade_level, chapter, thumbnail_url)')
    .in('room_id', roomIds)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// --- Recommendations ---

export async function getLessonRecommendation(userId: string, lessonId: string) {
  const admin = createAdminClient();

  const { data: events } = await admin
    .from('lesson_events')
    .select('event_type, data')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .eq('event_type', 'quiz_attempt');

  if (!events || events.length === 0) return 'learn_next';

  const attempts = events.map((e: Record<string, unknown>) => e.data as { correct?: boolean });
  const correctCount = attempts.filter((a) => a.correct).length;
  const accuracy = correctCount / attempts.length;

  if (accuracy >= 0.8) return 'expand';
  if (accuracy >= 0.5) return 'learn_next';
  return 'review';
}
