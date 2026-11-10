import { NextResponse } from 'next/server';
import { requireStudent, fail } from '@/lib/duel/api';
import { inviteFriend } from '@/services/duels';

export async function POST(req: Request) {
  const auth = await requireStudent();
  if ('error' in auth) return auth.error;
  const body = await req.json().catch(() => null);
  if (typeof body?.assignmentId !== 'string' || typeof body?.guestId !== 'string') return fail(new Error('Dữ liệu không hợp lệ'));
  try {
    return NextResponse.json(await inviteFriend(auth.profile.id, body.assignmentId, body.guestId));
  } catch (e) {
    return fail(e);
  }
}
