import { getCurrentProfile } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import {
  getRoomReports,
  getRoomAssignmentDetails,
  getStudentReports,
  getSkillReports,
  getQuestionReports,
  getInactiveStudents,
  getTimeSavedStats,
  createAuditLog,
} from '@/services/reports';

export async function GET(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const tab = req.nextUrl.searchParams.get('tab') ?? 'rooms';
  const roomId = req.nextUrl.searchParams.get('room') ?? undefined;
  const studentId = req.nextUrl.searchParams.get('student') ?? undefined;

  if (studentId) {
    await createAuditLog(
      profile.id,
      'view_student_report',
      'student',
      studentId,
      { tab, room_id: roomId },
      req.headers.get('x-forwarded-for') ?? undefined
    );
  }

  switch (tab) {
    case 'rooms':
      return NextResponse.json(await getRoomReports(profile.id));
    case 'room-detail':
      if (!roomId) return NextResponse.json({ error: 'room required' }, { status: 400 });
      return NextResponse.json(await getRoomAssignmentDetails(profile.id, roomId));
    case 'students':
      return NextResponse.json(await getStudentReports(profile.id, roomId));
    case 'skills':
      return NextResponse.json(await getSkillReports(profile.id, roomId));
    case 'questions':
      return NextResponse.json(await getQuestionReports(profile.id, roomId));
    case 'inactive':
      return NextResponse.json(await getInactiveStudents(profile.id));
    case 'time-saved':
      return NextResponse.json(await getTimeSavedStats(profile.id));
    default:
      return NextResponse.json({ error: 'Invalid tab' }, { status: 400 });
  }
}
