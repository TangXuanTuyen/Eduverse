import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { getStudentDetailReport } from '@/services/reports';

export async function GET(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const studentId = req.nextUrl.searchParams.get('student_id');
  if (!studentId) {
    return NextResponse.json({ error: 'Missing student_id' }, { status: 400 });
  }

  const report = await getStudentDetailReport(profile.id, studentId);
  if (!report) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(report);
}
