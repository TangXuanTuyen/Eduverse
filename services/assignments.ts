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
  assignment_type: 'quiz' | 'lesson' | 'experiment' | 'model3d';
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
  assignment_type: 'lesson' | 'experiment' | 'model3d';
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
    const typeLabel = data.assignment_type === 'lesson' ? 'Đọc lý thuyết' : 'Xem thí nghiệm';
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
