import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

export type LabAssignmentRow = {
  id: string;
  experiment_id: string;
  room_id: string;
  assigned_by: string;
  due_at: string | null;
  created_at: string;
};

export type LabSubmissionRow = {
  id: string;
  lab_assignment_id: string | null;
  experiment_id: string;
  user_id: string;
  status: 'started' | 'completed';
  started_at: string;
  completed_at: string | null;
  notes: string | null;
};

export async function assignExperiment(
  teacherId: string,
  experimentId: string,
  roomId: string,
  dueAt?: string
) {
  const admin = createAdminClient();

  // Verify teacher owns room
  const { data: room } = await admin
    .from('rooms')
    .select('id')
    .eq('id', roomId)
    .eq('owner_id', teacherId)
    .single();
  if (!room) throw new Error('Không tìm thấy lớp');

  const { data, error } = await admin
    .from('lab_assignments')
    .upsert(
      {
        experiment_id: experimentId,
        room_id: roomId,
        assigned_by: teacherId,
        due_at: dueAt ?? null,
      },
      { onConflict: 'experiment_id,room_id' }
    )
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function getTeacherLabAssignments(teacherId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('lab_assignments')
    .select('*, experiments(title, subject, grade_level, thumbnail_url), rooms(name)')
    .eq('assigned_by', teacherId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getStudentLabAssignments(userId: string) {
  const admin = createAdminClient();

  // Get rooms the student belongs to
  const { data: memberships } = await admin
    .from('room_members')
    .select('room_id')
    .eq('user_id', userId);
  const roomIds = (memberships ?? []).map((m: { room_id: string }) => m.room_id);
  if (roomIds.length === 0) return [];

  const { data, error } = await admin
    .from('lab_assignments')
    .select('*, experiments(id, title, description, subject, grade_level, thumbnail_url, component_key, embed_url, duration_minutes, difficulty)')
    .in('room_id', roomIds)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function startExperiment(
  userId: string,
  experimentId: string,
  labAssignmentId?: string
) {
  const admin = createAdminClient();

  // Check if already started
  const { data: existing } = await admin
    .from('lab_submissions')
    .select('id, status')
    .eq('user_id', userId)
    .eq('experiment_id', experimentId)
    .maybeSingle();

  if (existing) return { submissionId: existing.id, status: existing.status };

  const { data, error } = await admin
    .from('lab_submissions')
    .insert({
      experiment_id: experimentId,
      user_id: userId,
      lab_assignment_id: labAssignmentId ?? null,
      status: 'started',
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return { submissionId: data.id as string, status: 'started' as const };
}

export async function completeExperiment(userId: string, submissionId: string) {
  const admin = createAdminClient();

  const { error } = await admin
    .from('lab_submissions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export async function getStudentSubmissions(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('lab_submissions')
    .select('experiment_id, status')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return data as { experiment_id: string; status: string }[];
}

export async function getLabStats(teacherId: string, roomId: string) {
  const admin = createAdminClient();

  // Get assignments for this room
  const { data: assignments } = await admin
    .from('lab_assignments')
    .select('id, experiment_id, experiments(title)')
    .eq('room_id', roomId)
    .eq('assigned_by', teacherId);

  if (!assignments?.length) return [];

  // Get room members count
  const { count: memberCount } = await admin
    .from('room_members')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', roomId);

  const stats = await Promise.all(
    assignments.map(async (a) => {
      const { count: completedCount } = await admin
        .from('lab_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('lab_assignment_id', a.id)
        .eq('status', 'completed');

      return {
        assignmentId: a.id,
        experimentId: a.experiment_id,
        experimentTitle: (a.experiments as unknown as { title: string })?.title ?? '',
        totalStudents: memberCount ?? 0,
        completed: completedCount ?? 0,
      };
    })
  );

  return stats;
}
