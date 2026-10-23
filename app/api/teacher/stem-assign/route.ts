import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { createTaskAssignment } from '@/services/assignments';

export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { room_id, resource_id, resource_title, title } = body;

  if (!room_id || !resource_id || !resource_title || !title) {
    return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
  }

  try {
    await createTaskAssignment(profile.id, {
      room_id,
      title,
      assignment_type: 'stem',
      resource_id,
      resource_title,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi server';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
