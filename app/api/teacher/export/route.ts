import { getCurrentProfile } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { getSubmissionStats, getAssignment } from '@/services/assignments';

export async function GET(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const assignmentId = req.nextUrl.searchParams.get('assignment');
  if (!assignmentId) return NextResponse.json({ error: 'Missing assignment' }, { status: 400 });

  const [assignment, stats] = await Promise.all([
    getAssignment(assignmentId),
    getSubmissionStats(assignmentId),
  ]);

  // Lazy load exceljs
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Điểm');

  sheet.columns = [
    { header: 'Học sinh', key: 'name', width: 25 },
    { header: 'Trạng thái', key: 'status', width: 15 },
    { header: 'Điểm', key: 'score', width: 10 },
    { header: 'Tối đa', key: 'max', width: 10 },
    { header: 'Nộp lúc', key: 'submitted', width: 20 },
  ];

  const statusMap: Record<string, string> = {
    draft: 'Nháp',
    submitted: 'Đã nộp',
    graded: 'Đã chấm',
    published: 'Đã công bố',
  };

  for (const s of stats) {
    sheet.addRow({
      name: s.student.display_name,
      status: statusMap[s.status] ?? s.status,
      score: s.total_score ?? '',
      max: s.max_score ?? '',
      submitted: s.submitted_at ? new Date(s.submitted_at).toLocaleString('vi-VN') : '',
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(assignment.title)}.xlsx"`,
    },
  });
}
