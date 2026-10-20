import { getCurrentProfile } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { getWeeklySummary, getProgressTrend } from '@/services/reports';

export async function GET(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'parent') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const studentId = req.nextUrl.searchParams.get('student');
  const view = req.nextUrl.searchParams.get('view') ?? 'summary';

  if (!studentId) {
    return NextResponse.json({ error: 'Missing student' }, { status: 400 });
  }

  switch (view) {
    case 'summary': {
      const weekParam = req.nextUrl.searchParams.get('week');
      const weekStart = weekParam ? new Date(weekParam) : undefined;
      const summary = await getWeeklySummary(profile.id, studentId, weekStart);
      if (!summary) {
        return NextResponse.json({ error: 'Không có quyền xem học sinh này' }, { status: 403 });
      }
      return NextResponse.json(summary);
    }
    case 'trend': {
      const trend = await getProgressTrend(profile.id, studentId);
      return NextResponse.json(trend);
    }
    default:
      return NextResponse.json({ error: 'Invalid view' }, { status: 400 });
  }
}
