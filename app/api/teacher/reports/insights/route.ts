import { getCurrentProfile } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { getAssignmentInsights } from '@/services/assignment-insights';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const assignmentId = req.nextUrl.searchParams.get('assignment');
  if (!assignmentId) return NextResponse.json({ error: 'assignment required' }, { status: 400 });

  const result = await getAssignmentInsights(profile.id, assignmentId);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(result);
}
