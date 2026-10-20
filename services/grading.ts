import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

export type GradingQueueItem = {
  submission_id: string;
  assignment_id: string;
  assignment_title: string;
  student_name: string;
  student_id: string;
  submitted_at: string | null;
  status: string;
  essay_count: number;
};

export type AttemptForGrading = {
  id: string;
  assignment_question_id: string;
  student_answer: unknown;
  is_correct: boolean | null;
  score: number | null;
  feedback: string | null;
  question: {
    sort_order: number;
    type: string;
    content: string;
    options: unknown;
    correct_answer: unknown;
    explanation: string;
    points: number;
  };
};

export async function getGradingQueue(teacherId: string) {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('submissions')
    .select(`
      id,
      assignment_id,
      student_id,
      submitted_at,
      status,
      assignments!inner(title, room_id, rooms!inner(owner_id)),
      profiles!submissions_student_id_fkey(display_name)
    `)
    .eq('assignments.rooms.owner_id', teacherId)
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((s: Record<string, unknown>) => ({
    submission_id: s.id,
    assignment_id: s.assignment_id,
    assignment_title: ((s.assignments as Record<string, unknown>)?.title ?? '') as string,
    student_name: ((s.profiles as Record<string, unknown>)?.display_name ?? '') as string,
    student_id: s.student_id,
    submitted_at: s.submitted_at,
    status: s.status,
  })) as GradingQueueItem[];
}

export async function getSubmissionForGrading(submissionId: string, teacherId: string) {
  const admin = createAdminClient();

  // Verify teacher owns the room
  const { data: sub } = await admin
    .from('submissions')
    .select('id, assignment_id, student_id, status, assignments!inner(room_id, rooms!inner(owner_id))')
    .eq('id', submissionId)
    .single();

  if (!sub) throw new Error('Không tìm thấy bài nộp');
  const rooms = (sub as Record<string, unknown>).assignments as Record<string, unknown>;
  const roomOwner = (rooms?.rooms as Record<string, unknown>)?.owner_id;
  if (roomOwner !== teacherId) throw new Error('Không có quyền');

  // Get attempts with question info
  const { data: attempts } = await admin
    .from('question_attempts')
    .select('id, assignment_question_id, student_answer, is_correct, score, feedback')
    .eq('submission_id', submissionId);

  const { data: aqs } = await admin
    .from('assignment_questions')
    .select('id, sort_order, type, content, options, correct_answer, explanation, points')
    .eq('assignment_id', (sub as Record<string, unknown>).assignment_id as string)
    .order('sort_order');

  const aqMap = new Map((aqs ?? []).map((q: Record<string, unknown>) => [q.id, q]));

  return (attempts ?? []).map((a: Record<string, unknown>) => ({
    ...a,
    question: aqMap.get(a.assignment_question_id) ?? {},
  })) as unknown as AttemptForGrading[];
}

export async function gradeAttempt(
  attemptId: string,
  teacherId: string,
  score: number,
  feedback: string | null
) {
  const admin = createAdminClient();

  // Get attempt → submission → assignment → room → verify teacher
  const { data: attempt } = await admin
    .from('question_attempts')
    .select('id, submission_id, submissions!inner(assignment_id, assignments!inner(room_id, rooms!inner(owner_id)))')
    .eq('id', attemptId)
    .single();

  if (!attempt) throw new Error('Không tìm thấy câu trả lời');

  const { error } = await admin
    .from('question_attempts')
    .update({
      score,
      is_correct: score > 0,
      feedback,
    })
    .eq('id', attemptId);
  if (error) throw new Error(error.message);
}

export async function finalizeGrading(submissionId: string, teacherId: string) {
  const admin = createAdminClient();

  // Recalculate total
  const { data: attempts } = await admin
    .from('question_attempts')
    .select('score')
    .eq('submission_id', submissionId);

  const totalScore = (attempts ?? []).reduce((s: number, a: Record<string, unknown>) => s + (Number(a.score) || 0), 0);

  // Get max_score from assignment_questions
  const { data: sub } = await admin
    .from('submissions')
    .select('assignment_id')
    .eq('id', submissionId)
    .single();

  const { data: aqs } = await admin
    .from('assignment_questions')
    .select('points')
    .eq('assignment_id', (sub as Record<string, unknown>).assignment_id as string);

  const maxScore = (aqs ?? []).reduce((s: number, q: Record<string, unknown>) => s + (Number(q.points) || 0), 0);

  const { error } = await admin
    .from('submissions')
    .update({
      status: 'graded',
      total_score: totalScore,
      max_score: maxScore,
      graded_at: new Date().toISOString(),
      graded_by: teacherId,
    })
    .eq('id', submissionId);
  if (error) throw new Error(error.message);
}

export async function publishResults(assignmentId: string, teacherId: string) {
  const admin = createAdminClient();

  // Verify ownership
  const { data: assignment } = await admin
    .from('assignments')
    .select('id, room_id, rooms!inner(owner_id)')
    .eq('id', assignmentId)
    .single();
  if (!assignment) throw new Error('Không tìm thấy bài giao');

  // Update all graded submissions to published
  const { error: subErr } = await admin
    .from('submissions')
    .update({ status: 'published' })
    .eq('assignment_id', assignmentId)
    .eq('status', 'graded');
  if (subErr) throw new Error(subErr.message);

  const { error } = await admin
    .from('assignments')
    .update({ results_published: true })
    .eq('id', assignmentId);
  if (error) throw new Error(error.message);
}
