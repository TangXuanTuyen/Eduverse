import { getCurrentProfile } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import {
  getStudentReports,
  getSkillReports,
  getQuestionReports,
  getInactiveStudents,
} from '@/services/reports';

export async function GET(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const tab = req.nextUrl.searchParams.get('tab') ?? 'students';
  const roomId = req.nextUrl.searchParams.get('room') ?? undefined;

  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();

  switch (tab) {
    case 'students': {
      const data = await getStudentReports(profile.id, roomId);
      const sheet = workbook.addWorksheet('Học sinh');
      sheet.columns = [
        { header: 'Họ tên', key: 'name', width: 25 },
        { header: 'Khối', key: 'grade', width: 8 },
        { header: 'XP', key: 'xp', width: 10 },
        { header: 'Bài hoàn thành', key: 'done', width: 15 },
        { header: 'Điểm TB (%)', key: 'avg', width: 12 },
        { header: 'Ngày không HĐ', key: 'inactive', width: 15 },
        { header: 'Cần chú ý', key: 'attention', width: 12 },
      ];
      for (const s of data) {
        sheet.addRow({
          name: s.display_name,
          grade: s.grade,
          xp: s.total_xp,
          done: s.assignments_completed,
          avg: s.avg_score,
          inactive: s.days_inactive >= 999 ? 'Chưa HĐ' : `${s.days_inactive} ngày`,
          attention: s.needs_attention ? 'Có' : '',
        });
      }
      break;
    }
    case 'skills': {
      const data = await getSkillReports(profile.id, roomId);
      const sheet = workbook.addWorksheet('Kỹ năng');
      sheet.columns = [
        { header: 'Kỹ năng', key: 'skill', width: 25 },
        { header: 'Số lượt', key: 'total', width: 12 },
        { header: 'Đúng', key: 'correct', width: 10 },
        { header: 'Tỉ lệ (%)', key: 'accuracy', width: 12 },
      ];
      for (const s of data) {
        sheet.addRow({ skill: s.skill, total: s.total_attempts, correct: s.correct_count, accuracy: s.accuracy });
      }
      break;
    }
    case 'questions': {
      const data = await getQuestionReports(profile.id, roomId);
      const sheet = workbook.addWorksheet('Câu hỏi');
      sheet.columns = [
        { header: 'Câu hỏi', key: 'content', width: 40 },
        { header: 'Loại', key: 'type', width: 15 },
        { header: 'Số lượt', key: 'total', width: 12 },
        { header: 'Đúng', key: 'correct', width: 10 },
        { header: 'Tỉ lệ (%)', key: 'accuracy', width: 12 },
        { header: 'Thời gian TB (s)', key: 'time', width: 15 },
      ];
      for (const q of data) {
        sheet.addRow({
          content: q.content,
          type: q.type,
          total: q.total_attempts,
          correct: q.correct_count,
          accuracy: q.accuracy,
          time: q.avg_time_seconds ?? '',
        });
      }
      break;
    }
    case 'inactive': {
      const data = await getInactiveStudents(profile.id);
      const sheet = workbook.addWorksheet('Không hoạt động');
      sheet.columns = [
        { header: 'Họ tên', key: 'name', width: 25 },
        { header: 'Phòng', key: 'room', width: 20 },
        { header: 'HĐ lần cuối', key: 'last', width: 15 },
        { header: 'Số ngày', key: 'days', width: 10 },
      ];
      for (const s of data) {
        sheet.addRow({
          name: s.display_name,
          room: s.room_name,
          last: s.last_active_date ?? 'Chưa HĐ',
          days: s.days_inactive >= 999 ? '—' : s.days_inactive,
        });
      }
      break;
    }
    default:
      return NextResponse.json({ error: 'Invalid tab' }, { status: 400 });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const tabNames: Record<string, string> = {
    students: 'Hoc-sinh',
    skills: 'Ky-nang',
    questions: 'Cau-hoi',
    inactive: 'Khong-hoat-dong',
  };

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Bao-cao-${tabNames[tab] ?? tab}.xlsx"`,
    },
  });
}
