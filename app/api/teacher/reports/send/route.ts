import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { sendReportToParent } from '@/services/reports';

export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await req.json();
  const { student_id, week, phone_number, strengths, improvements, teacher_note } = body;

  if (!student_id) {
    return NextResponse.json({ error: 'Missing student_id' }, { status: 400 });
  }

  const result = await sendReportToParent(profile.id, student_id, {
    week: week ?? null,
    phoneNumber: phone_number ?? null,
    strengths: strengths ?? null,
    improvements: improvements ?? null,
    teacherNote: teacher_note ?? null,
  });

  return NextResponse.json(result);
}
