import { NextRequest, NextResponse } from 'next/server';
import { requireStudent, fail } from '@/lib/duel/api';
import { listClassmates } from '@/services/duels';

export async function GET(req: NextRequest) {
  const auth = await requireStudent();
  if ('error' in auth) return auth.error;
  const assignmentId = req.nextUrl.searchParams.get('assignmentId');
  if (!assignmentId) return fail(new Error('Thiếu bài giao'));
  try {
    return NextResponse.json({ classmates: await listClassmates(auth.profile.id, assignmentId) });
  } catch (e) {
    return fail(e);
  }
}
