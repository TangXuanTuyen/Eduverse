import { getCurrentProfile } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { getTeacherQuestions } from '@/services/questions';

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') {
    return NextResponse.json({ questions: [] }, { status: 403 });
  }

  const { questions } = await getTeacherQuestions(profile.id, { limit: 200 });
  return NextResponse.json({
    questions: questions.map((q) => ({ id: q.id, type: q.type, content: q.content })),
  });
}
