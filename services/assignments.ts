import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

export type AssignmentRow = {
  id: string;
  room_id: string;
  title: string;
  description: string;
  due_at: string | null;
  late_policy: 'hard_lock' | 'marked_late';
  max_retries: number;
  show_explanation_after_submit: boolean;
  results_published: boolean;
  assignment_type: 'quiz' | 'lesson' | 'experiment' | 'model3d' | 'stem' | 'game';
  resource_id: string | null;
  resource_title: string | null;
  created_by: string;
  created_at: string;
};

export type AssignmentQuestion = {
  id: string;
  sort_order: number;
  type: string;
  content: string;
  options: { id: string; text: string }[] | null;
  explanation: string;
  points: number;
};

export type CreateAssignmentData = {
  room_id: string;
  title: string;
  description?: string;
  due_at?: string | null;
  late_policy?: 'hard_lock' | 'marked_late';
  max_retries?: number;
  show_explanation_after_submit?: boolean;
  question_ids: string[];
  assignment_type?: 'quiz' | 'game';
};

export async function getTeacherAssignments(teacherId: string, roomId?: string) {
  const admin = createAdminClient();
  let query = admin
    .from('assignments')
    .select('*, rooms!inner(owner_id)')
    .eq('rooms.owner_id', teacherId)
    .order('created_at', { ascending: false });

  if (roomId) query = query.eq('room_id', roomId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as AssignmentRow[];
}

export async function getAssignment(assignmentId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('assignments')
    .select('*')
    .eq('id', assignmentId)
    .single();
  if (error) throw new Error(error.message);
  return data as AssignmentRow;
}

export async function getStudentAssignments(studentId: string) {
  const admin = createAdminClient();
  // Get student's room IDs first
  const { data: memberRows } = await admin
    .from('room_members')
    .select('room_id')
    .eq('user_id', studentId)
    .eq('is_active', true);
  const roomIds = (memberRows ?? []).map((r: { room_id: string }) => r.room_id);
  if (roomIds.length === 0) return [];

  const { data, error } = await admin
    .from('assignments')
    .select('*, rooms!inner(id, name)')
    .in('room_id', roomIds)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as unknown as (AssignmentRow & { rooms: { id: string; name: string } })[];
}

export async function createAssignment(teacherId: string, data: CreateAssignmentData) {
  const admin = createAdminClient();

  // Verify teacher owns the room
  const { data: room, error: roomErr } = await admin
    .from('rooms')
    .select('id')
    .eq('id', data.room_id)
    .eq('owner_id', teacherId)
    .single();
  if (roomErr || !room) throw new Error('Không có quyền tạo bài giao cho phòng này');

  // Create assignment
  const { data: assignment, error: aErr } = await admin
    .from('assignments')
    .insert({
      room_id: data.room_id,
      title: data.title,
      description: data.description ?? '',
      due_at: data.due_at ?? null,
      late_policy: data.late_policy ?? 'hard_lock',
      max_retries: data.max_retries ?? 0,
      show_explanation_after_submit: data.show_explanation_after_submit ?? true,
      assignment_type: data.assignment_type ?? 'quiz',
      created_by: teacherId,
    })
    .select('id')
    .single();
  if (aErr) throw new Error(aErr.message);

  if (data.question_ids.length === 0) {
    await admin.from('assignments').delete().eq('id', assignment.id);
    throw new Error('Bộ đề trống — cần ít nhất 1 câu hỏi');
  }

  // Snapshot questions + answers
  {
    const { data: questions, error: qErr } = await admin
      .from('questions')
      .select('id, type, content, options, explanation')
      .eq('owner_id', teacherId)
      .in('id', data.question_ids);
    if (qErr) throw new Error(qErr.message);

    const questionMap = new Map(questions.map((q: Record<string, unknown>) => [q.id, q]));

    // Get answers
    const { data: answers } = await admin
      .from('question_answers')
      .select('question_id, correct_answer')
      .in('question_id', data.question_ids);
    const answerMap = new Map((answers ?? []).map((a: Record<string, unknown>) => [a.question_id, a.correct_answer]));

    const snapshots = data.question_ids
      .map((qId, i) => {
        const q = questionMap.get(qId);
        if (!q) return null;
        return {
          assignment_id: assignment.id,
          source_question_id: qId,
          sort_order: i,
          type: (q as Record<string, unknown>).type,
          content: (q as Record<string, unknown>).content,
          options: (q as Record<string, unknown>).options ?? null,
          correct_answer: answerMap.get(qId) ?? null,
          explanation: (q as Record<string, unknown>).explanation ?? '',
          points: 1,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s != null);

    if (snapshots.length === 0) {
      await admin.from('assignments').delete().eq('id', assignment.id);
      throw new Error('Không tìm thấy câu hỏi hợp lệ trong bộ đề');
    }

    const { error: snapErr } = await admin.from('assignment_questions').insert(snapshots);
    if (snapErr) throw new Error(snapErr.message);
  }

  // Auto-notify all students in the room
  const { data: roomMembers } = await admin
    .from('room_members')
    .select('user_id, profiles!inner(role)')
    .eq('room_id', data.room_id)
    .eq('is_active', true);

  const studentIds = (roomMembers ?? [])
    .filter((m) => (m.profiles as unknown as { role: string }).role === 'student')
    .map((m) => m.user_id);

  if (studentIds.length > 0) {
    const notifications = studentIds.map((uid) => ({
      user_id: uid,
      room_id: data.room_id,
      type: 'new_assignment',
      title: `Bài giao mới: ${data.title}`,
      body: data.due_at
        ? `Hạn nộp: ${new Date(data.due_at).toLocaleDateString('vi-VN')}`
        : 'Chưa có hạn nộp',
    }));
    await admin.from('notifications').insert(notifications);
  }

  return assignment.id as string;
}

export type CreateTaskAssignmentData = {
  room_id: string;
  title: string;
  description?: string;
  assignment_type: 'lesson' | 'experiment' | 'model3d' | 'stem';
  resource_id: string;
  resource_title: string;
  due_at?: string | null;
};

export async function createTaskAssignment(teacherId: string, data: CreateTaskAssignmentData) {
  const admin = createAdminClient();

  const { data: room, error: roomErr } = await admin
    .from('rooms')
    .select('id')
    .eq('id', data.room_id)
    .eq('owner_id', teacherId)
    .single();
  if (roomErr || !room) throw new Error('Không có quyền tạo nhiệm vụ cho phòng này');

  const { data: assignment, error: aErr } = await admin
    .from('assignments')
    .insert({
      room_id: data.room_id,
      title: data.title,
      description: data.description ?? '',
      due_at: data.due_at ?? null,
      assignment_type: data.assignment_type,
      resource_id: data.resource_id,
      resource_title: data.resource_title,
      created_by: teacherId,
    })
    .select('id')
    .single();
  if (aErr) throw new Error(aErr.message);

  // Notify students
  const { data: roomMembers } = await admin
    .from('room_members')
    .select('user_id, profiles!inner(role)')
    .eq('room_id', data.room_id)
    .eq('is_active', true);

  const studentIds = (roomMembers ?? [])
    .filter((m) => (m.profiles as unknown as { role: string }).role === 'student')
    .map((m) => m.user_id);

  if (studentIds.length > 0) {
    const typeLabels: Record<string, string> = { lesson: 'Đọc lý thuyết', experiment: 'Xem thí nghiệm', model3d: 'Xem mô hình 3D', stem: 'STEM Maker' };
    const typeLabel = typeLabels[data.assignment_type] ?? 'Nhiệm vụ';
    const notifications = studentIds.map((uid) => ({
      user_id: uid,
      room_id: data.room_id,
      type: 'new_assignment',
      title: `Nhiệm vụ mới: ${data.title}`,
      body: `${typeLabel}: ${data.resource_title}`,
    }));
    await admin.from('notifications').insert(notifications);
  }

  return assignment.id as string;
}

export async function getSubmissionStats(assignmentId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('submissions')
    .select('id, student_id, status, total_score, max_score, submitted_at, profiles!inner(display_name)')
    .eq('assignment_id', assignmentId);
  if (error) throw new Error(error.message);
  return data as unknown as Array<{
    id: string;
    student_id: string;
    status: string;
    total_score: number | null;
    max_score: number | null;
    submitted_at: string | null;
    profiles: { display_name: string };
  }>;
}

export type QuestionAnalytics = {
  id: string;
  sort_order: number;
  content: string;
  type: string;
  points: number;
  totalAttempts: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  correctRate: number;
};

export async function getQuestionAnalytics(assignmentId: string): Promise<QuestionAnalytics[]> {
  const admin = createAdminClient();

  const { data: questions } = await admin
    .from('assignment_questions')
    .select('id, sort_order, content, type, points')
    .eq('assignment_id', assignmentId)
    .order('sort_order');

  if (!questions || questions.length === 0) return [];

  const qIds = questions.map((q: { id: string }) => q.id);

  const { data: attempts } = await admin
    .from('question_attempts')
    .select('assignment_question_id, is_correct, submission_id, submissions!inner(status)')
    .in('assignment_question_id', qIds);

  const submitted = (attempts ?? []).filter(
    (a) => (a.submissions as unknown as { status: string }).status !== 'draft'
  );

  const { count: submissionCount } = await admin
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('assignment_id', assignmentId)
    .neq('status', 'draft');

  const totalStudents = submissionCount ?? 0;

  return questions.map((q: { id: string; sort_order: number; content: string; type: string; points: number }) => {
    const qAttempts = submitted.filter((a) => a.assignment_question_id === q.id);
    const correct = qAttempts.filter((a) => a.is_correct === true).length;
    const incorrect = qAttempts.filter((a) => a.is_correct === false).length;
    const unanswered = totalStudents - qAttempts.length;
    const total = qAttempts.length;
    return {
      id: q.id,
      sort_order: q.sort_order,
      content: q.content,
      type: q.type,
      points: q.points,
      totalAttempts: total,
      correctCount: correct,
      incorrectCount: incorrect,
      unansweredCount: Math.max(0, unanswered),
      correctRate: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  });
}
