import { getCurrentProfile } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { generateStudentComment } from '@/services/student-comments';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const studentId = req.nextUrl.searchParams.get('student');
  if (!studentId) return NextResponse.json({ error: 'student required' }, { status: 400 });

  const result = await generateStudentComment(profile.id, studentId);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(result);
}
