import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

export type SubmissionRow = {
  id: string;
  assignment_id: string;
  student_id: string;
  attempt_number: number;
  status: 'draft' | 'submitted' | 'graded' | 'published';
  total_score: number | null;
  max_score: number | null;
  submitted_at: string | null;
  is_late: boolean;
};

export type AttemptRow = {
  id: string;
  submission_id: string;
  assignment_question_id: string;
  student_answer: unknown;
  is_correct: boolean | null;
  score: number | null;
  feedback: string | null;
};

export async function getOrCreateDraft(assignmentId: string, studentId: string) {
  const admin = createAdminClient();

  // Check existing draft
  const { data: existing } = await admin
    .from('submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('student_id', studentId)
    .eq('status', 'draft')
    .order('attempt_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing as SubmissionRow;

  // Check max retries
  const { data: assignment } = await admin
    .from('assignments')
    .select('max_retries')
    .eq('id', assignmentId)
    .single();

  const { count } = await admin
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('assignment_id', assignmentId)
    .eq('student_id', studentId);

  const attemptNum = (count ?? 0) + 1;
  if (assignment && assignment.max_retries > 0 && attemptNum > assignment.max_retries + 1) {
    throw new Error('Đã hết lượt làm bài');
  }

  const { data, error } = await admin
    .from('submissions')
    .insert({
      assignment_id: assignmentId,
      student_id: studentId,
      attempt_number: attemptNum,
      status: 'draft',
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as SubmissionRow;
}

export async function getStudentAttempts(submissionId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('question_attempts')
    .select('*')
    .eq('submission_id', submissionId);
  if (error) throw new Error(error.message);
  return data as AttemptRow[];
}

export async function saveDraft(
  submissionId: string,
  studentId: string,
  answers: Record<string, unknown>
) {
  const admin = createAdminClient();

  // Verify ownership + draft status
  const { data: sub } = await admin
    .from('submissions')
    .select('id, status')
    .eq('id', submissionId)
    .eq('student_id', studentId)
    .single();
  if (!sub) throw new Error('Không tìm thấy bài nộp');
  if (sub.status !== 'draft') throw new Error('Bài đã nộp, không thể sửa');

  for (const [aqId, answer] of Object.entries(answers)) {
    await admin
      .from('question_attempts')
      .upsert(
        { submission_id: submissionId, assignment_question_id: aqId, student_answer: answer },
        { onConflict: 'submission_id,assignment_question_id' }
      );
  }
}

export async function submitAssignment(submissionId: string, studentId: string) {
  const admin = createAdminClient();

  // Verify ownership + draft
  const { data: sub, error: subErr } = await admin
    .from('submissions')
    .select('id, assignment_id, status')
    .eq('id', submissionId)
    .eq('student_id', studentId)
    .single();
  if (subErr || !sub) throw new Error('Không tìm thấy bài nộp');
  if (sub.status !== 'draft') throw new Error('Bài đã nộp rồi');

  // Check late
  const { data: assignment } = await admin
    .from('assignments')
    .select('due_at, late_policy')
    .eq('id', sub.assignment_id)
    .single();

  const isLate = assignment?.due_at ? new Date() > new Date(assignment.due_at) : false;
  if (isLate && assignment?.late_policy === 'hard_lock') {
    throw new Error('Đã quá hạn nộp bài');
  }

  // Get assignment questions (with correct_answer for auto-grading)
  const { data: aqs } = await admin
    .from('assignment_questions')
    .select('id, type, correct_answer, points')
    .eq('assignment_id', sub.assignment_id);

  // Get student attempts
  const { data: attempts } = await admin
    .from('question_attempts')
    .select('id, assignment_question_id, student_answer')
    .eq('submission_id', submissionId);

  const attemptMap = new Map(
    (attempts ?? []).map((a: Record<string, unknown>) => [a.assignment_question_id, a])
  );

  let totalScore = 0;
  let maxScore = 0;
  let allAutoGraded = true;

  for (const aq of aqs ?? []) {
    const q = aq as Record<string, unknown>;
    const points = q.points as number;
    maxScore += points;

    const attempt = attemptMap.get(q.id) as Record<string, unknown> | undefined;
    if (!attempt) continue;

    const type = q.type as string;
    const correct = q.correct_answer;
    const studentAns = attempt.student_answer;

    let isCorrect: boolean | null = null;
    let score: number | null = null;

    if (type === 'single_choice') {
      isCorrect = JSON.stringify(studentAns) === JSON.stringify(correct);
      score = isCorrect ? points : 0;
    } else if (type === 'multiple_choice') {
      const s = Array.isArray(studentAns) ? [...studentAns].sort() : [];
      const c = Array.isArray(correct) ? [...correct].sort() : [];
      isCorrect = JSON.stringify(s) === JSON.stringify(c);
      score = isCorrect ? points : 0;
    } else if (type === 'short_answer') {
      const normalize = (v: unknown) => String(v ?? '').trim().toLowerCase();
      const accepted = Array.isArray(correct) ? correct.map(normalize) : [normalize(correct)];
      const ans = normalize(studentAns);
      isCorrect = accepted.includes(ans);
      score = isCorrect ? points : 0;
    } else {
      // essay — needs manual grading
      allAutoGraded = false;
    }

    await admin
      .from('question_attempts')
      .update({ is_correct: isCorrect, score })
      .eq('id', attempt.id);

    if (score != null) totalScore += score;
  }

  // Update submission
  const newStatus = allAutoGraded ? 'graded' : 'submitted';
  const { error: updErr } = await admin
    .from('submissions')
    .update({
      status: newStatus,
      total_score: totalScore,
      max_score: maxScore,
      submitted_at: new Date().toISOString(),
      is_late: isLate,
      ...(allAutoGraded ? { graded_at: new Date().toISOString() } : {}),
    })
    .eq('id', submissionId);
  if (updErr) throw new Error(updErr.message);

  return { status: newStatus, totalScore, maxScore, isLate };
}
