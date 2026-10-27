import { getCurrentProfile } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import {
  getStudentReports,
  getSkillReports,
  getQuestionReports,
  getInactiveStudents,
  getWeeklyTrends,
  getStemAnalysis,
  getErrorAnalysis,
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
        { header: 'Bài chưa nộp', key: 'pending', width: 12 },
      ];
      for (const s of data) {
        sheet.addRow({
          name: s.display_name,
          room: s.room_name,
          last: s.last_active_date ?? 'Chưa HĐ',
          days: s.days_inactive >= 999 ? '—' : s.days_inactive,
          pending: s.pending_assignments,
        });
      }
      break;
    }
    case 'trends': {
      const data = await getWeeklyTrends(profile.id, roomId);
      const sheet = workbook.addWorksheet('Xu hướng');
      sheet.columns = [
        { header: 'Tuần', key: 'week', width: 12 },
        { header: 'Số bài nộp', key: 'subs', width: 12 },
        { header: 'Đã chấm', key: 'graded', width: 12 },
        { header: 'Điểm TB (%)', key: 'avg', width: 12 },
        { header: 'Tỉ lệ hoàn thành (%)', key: 'rate', width: 18 },
      ];
      for (const t of data) {
        sheet.addRow({
          week: t.week_label,
          subs: t.submissions_count,
          graded: t.graded_count,
          avg: t.avg_score >= 0 ? t.avg_score : '',
          rate: t.completion_rate,
        });
      }
      break;
    }
    case 'stem': {
      const data = await getStemAnalysis(profile.id, roomId);
      const sheet = workbook.addWorksheet('STEM');
      sheet.columns = [
        { header: 'Nhiệm vụ', key: 'title', width: 30 },
        { header: 'Loại', key: 'type', width: 15 },
        { header: 'Lớp', key: 'room', width: 20 },
        { header: 'Tổng HS', key: 'total', width: 10 },
        { header: 'Hoàn thành', key: 'done', width: 12 },
        { header: 'Tỉ lệ (%)', key: 'rate', width: 12 },
      ];
      for (const s of data) {
        sheet.addRow({
          title: s.title,
          type: s.assignment_type === 'experiment' ? 'Thí nghiệm' : 'Lý thuyết',
          room: s.room_name,
          total: s.total_students,
          done: s.completed_count,
          rate: s.completion_rate,
        });
      }
      break;
    }
    case 'errors': {
      const data = await getErrorAnalysis(profile.id, roomId);
      const sheet = workbook.addWorksheet('Lỗi phổ biến');
      sheet.columns = [
        { header: 'Kỹ năng', key: 'skill', width: 25 },
        { header: 'Số lần sai', key: 'wrong', width: 12 },
        { header: 'Tổng lượt', key: 'total', width: 12 },
        { header: 'Tỉ lệ sai (%)', key: 'rate', width: 15 },
        { header: 'Câu hỏi mẫu', key: 'samples', width: 50 },
      ];
      for (const e of data) {
        sheet.addRow({
          skill: e.skill,
          wrong: e.wrong_count,
          total: e.total_count,
          rate: e.error_rate,
          samples: e.sample_questions.join(' | '),
        });
      }
      break;
    }
    case 'all': {
      const [students, skills, questions, inactive, trends, stem, errors] = await Promise.all([
        getStudentReports(profile.id, roomId),
        getSkillReports(profile.id, roomId),
        getQuestionReports(profile.id, roomId),
        getInactiveStudents(profile.id),
        getWeeklyTrends(profile.id, roomId),
        getStemAnalysis(profile.id, roomId),
        getErrorAnalysis(profile.id, roomId),
      ]);

      const s1 = workbook.addWorksheet('Học sinh');
      s1.columns = [
        { header: 'Họ tên', key: 'name', width: 25 },
        { header: 'XP', key: 'xp', width: 10 },
        { header: 'Bài xong', key: 'done', width: 12 },
        { header: 'Điểm TB (%)', key: 'avg', width: 12 },
        { header: 'Không HĐ', key: 'inactive', width: 12 },
      ];
      for (const st of students) {
        s1.addRow({ name: st.display_name, xp: st.total_xp, done: st.assignments_completed, avg: st.avg_score, inactive: st.days_inactive >= 999 ? 'Chưa' : `${st.days_inactive}d` });
      }

      const s2 = workbook.addWorksheet('Kỹ năng');
      s2.columns = [
        { header: 'Kỹ năng', key: 'skill', width: 25 },
        { header: 'Lượt', key: 'total', width: 10 },
        { header: 'Đúng', key: 'correct', width: 10 },
        { header: '%', key: 'acc', width: 8 },
      ];
      for (const sk of skills) s2.addRow({ skill: sk.skill, total: sk.total_attempts, correct: sk.correct_count, acc: sk.accuracy });

      const s3 = workbook.addWorksheet('Câu hỏi');
      s3.columns = [
        { header: 'Câu hỏi', key: 'q', width: 40 },
        { header: 'Lượt', key: 'total', width: 10 },
        { header: '%', key: 'acc', width: 8 },
      ];
      for (const q of questions) s3.addRow({ q: q.content, total: q.total_attempts, acc: q.accuracy });

      if (inactive.length > 0) {
        const s4 = workbook.addWorksheet('Không HĐ');
        s4.columns = [
          { header: 'Họ tên', key: 'name', width: 25 },
          { header: 'Lớp', key: 'room', width: 20 },
          { header: 'Ngày', key: 'days', width: 10 },
          { header: 'Bài thiếu', key: 'pending', width: 10 },
        ];
        for (const i of inactive) s4.addRow({ name: i.display_name, room: i.room_name, days: i.days_inactive >= 999 ? '—' : i.days_inactive, pending: i.pending_assignments });
      }

      if (trends.length > 0) {
        const s5 = workbook.addWorksheet('Xu hướng');
        s5.columns = [
          { header: 'Tuần', key: 'w', width: 12 },
          { header: 'Nộp', key: 'subs', width: 10 },
          { header: 'Điểm TB', key: 'avg', width: 10 },
        ];
        for (const t of trends) s5.addRow({ w: t.week_label, subs: t.submissions_count, avg: t.avg_score >= 0 ? t.avg_score : '' });
      }

      if (stem.length > 0) {
        const s6 = workbook.addWorksheet('STEM');
        s6.columns = [
          { header: 'Nhiệm vụ', key: 'title', width: 30 },
          { header: 'Loại', key: 'type', width: 12 },
          { header: 'Hoàn thành', key: 'rate', width: 12 },
        ];
        for (const st of stem) s6.addRow({ title: st.title, type: st.assignment_type === 'experiment' ? 'TN' : 'LT', rate: `${st.completion_rate}%` });
      }

      if (errors.length > 0) {
        const s7 = workbook.addWorksheet('Lỗi');
        s7.columns = [
          { header: 'Kỹ năng', key: 'skill', width: 25 },
          { header: '% sai', key: 'rate', width: 10 },
          { header: 'Câu mẫu', key: 'samples', width: 50 },
        ];
        for (const e of errors) s7.addRow({ skill: e.skill, rate: e.error_rate, samples: e.sample_questions.join(' | ') });
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
    trends: 'Xu-huong',
    stem: 'STEM',
    errors: 'Loi-pho-bien',
    all: 'Tong-hop',
  };

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Bao-cao-${tabNames[tab] ?? tab}.xlsx"`,
    },
  });
}
