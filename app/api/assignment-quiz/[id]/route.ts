import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: assignment } = await admin
    .from('assignments')
    .select('id, title, description, room_id, due_at, assignment_type')
    .eq('id', id)
    .single();

  if (!assignment || (assignment.assignment_type !== 'quiz' && assignment.assignment_type !== null)) {
    return NextResponse.json({ error: 'Không tìm thấy bài kiểm tra' }, { status: 404 });
  }

  const { data: member } = await admin
    .from('room_members')
    .select('id')
    .eq('room_id', assignment.room_id)
    .eq('user_id', profile.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ error: 'Bạn không thuộc lớp này' }, { status: 403 });
  }

  const { data: questions } = await admin
    .from('assignment_questions')
    .select('id, sort_order, type, content, options, explanation, points')
    .eq('assignment_id', id)
    .order('sort_order');

  const { data: existingSub } = await admin
    .from('submissions')
    .select('id, status, total_score, max_score')
    .eq('assignment_id', id)
    .eq('student_id', profile.id)
    .order('attempt_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    assignment: {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      due_at: assignment.due_at,
    },
    questions: questions ?? [],
    existingSubmission: existingSub,
  });
}
