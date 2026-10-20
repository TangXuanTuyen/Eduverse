import { getCurrentProfile } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { updateProgress } from '@/services/lessons';

export async function POST(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({}, { status: 401 });

  const body = await req.json();
  const { lessonId, currentStep, completedStep, isCompleted } = body;
  if (!lessonId) return NextResponse.json({ error: 'Thiếu lessonId' }, { status: 400 });

  try {
    await updateProgress(profile.id, lessonId, {
      current_step: currentStep,
      completed_step: completedStep,
      is_completed: isCompleted,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({}, { status: 500 });
  }
}
