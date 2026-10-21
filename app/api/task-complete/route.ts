import { getCurrentProfile } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { awardXp } from '@/services/xp';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'student') {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  }

  const { assignment_id } = await request.json();
  if (!assignment_id) {
    return NextResponse.json({ error: 'Thiếu assignment_id' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify assignment is a task (not quiz) and student is in the room
  const { data: assignment, error: aErr } = await admin
    .from('assignments')
    .select('id, room_id, assignment_type')
    .eq('id', assignment_id)
    .single();

  if (aErr || !assignment) {
    return NextResponse.json({ error: 'Không tìm thấy nhiệm vụ' }, { status: 404 });
  }

  if (assignment.assignment_type === 'quiz') {
    return NextResponse.json({ error: 'Đây là bài tập, không phải nhiệm vụ' }, { status: 400 });
  }

  // Check room membership
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

  // Insert task_completion (idempotent via UNIQUE constraint)
  const { error: insertErr } = await admin
    .from('task_completions')
    .insert({
      assignment_id,
      student_id: profile.id,
    });

  if (insertErr) {
    if (insertErr.code === '23505') {
      return NextResponse.json({ already: true, message: 'Đã hoàn thành trước đó' });
    }
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Award XP
  let xpAwarded = 0;
  try {
    const result = await awardXp(
      profile.id,
      'task_complete',
      `task:${assignment_id}:${profile.id}`,
    );
    xpAwarded = result.awarded;
  } catch {
    // XP failure should not block completion
  }

  return NextResponse.json({ success: true, xpAwarded });
}
