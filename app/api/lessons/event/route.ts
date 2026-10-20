import { getCurrentProfile } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { recordLessonEvent } from '@/services/lessons';

export async function POST(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({}, { status: 401 });

  const { lessonId, stepIndex, eventType, data } = await req.json();
  if (!lessonId || !eventType) {
    return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
  }

  try {
    await recordLessonEvent(profile.id, lessonId, eventType, stepIndex, data);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({}, { status: 500 });
  }
}
