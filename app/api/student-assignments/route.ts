import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStudentAssignments } from '@/services/assignments';

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const assignments = await getStudentAssignments(profile.id);

    // Nhiệm vụ (không phải bài trắc nghiệm) học sinh đã xác nhận hoàn thành
    const { data: done } = await createAdminClient()
      .from('task_completions')
      .select('assignment_id')
      .eq('student_id', profile.id);
    const doneIds = new Set((done ?? []).map((d: { assignment_id: string }) => d.assignment_id));

    return NextResponse.json({
      assignments: assignments.map((a) => ({ ...a, completed: doneIds.has(a.id) })),
    });
  } catch {
    return NextResponse.json({ assignments: [] });
  }
}
