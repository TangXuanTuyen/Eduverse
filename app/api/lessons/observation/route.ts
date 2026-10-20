import { getCurrentProfile } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { saveObservationNote } from '@/services/lessons';

export async function POST(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({}, { status: 401 });

  const { lessonId, stepIndex, prediction, observation, explanation } = await req.json();
  if (!lessonId || stepIndex === undefined) {
    return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
  }

  try {
    await saveObservationNote(profile.id, lessonId, stepIndex, {
      prediction, observation, explanation,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({}, { status: 500 });
  }
}
