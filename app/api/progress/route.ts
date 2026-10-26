import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { getStudentProgress, saveStudentProgress } from '@/services/student-progress';

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const progress = await getStudentProgress(profile.id);
  return NextResponse.json({ progress });
}

export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    await saveStudentProgress(profile.id, {
      level: Math.max(1, Math.floor(Number(body.level) || 1)),
      currentXP: Math.max(0, Math.floor(Number(body.currentXP) || 0)),
      totalXP: Math.max(0, Math.floor(Number(body.totalXP) || 0)),
      quizzesCompleted: Math.max(0, Math.floor(Number(body.quizzesCompleted) || 0)),
      highScore: Math.max(0, Math.floor(Number(body.highScore) || 0)),
      experimentsCompleted: Array.isArray(body.experimentsCompleted) ? body.experimentsCompleted.filter((s: unknown) => typeof s === 'string') : [],
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
