import { NextResponse } from 'next/server';
import { requireStudent, fail } from '@/lib/duel/api';
import { respondInvite } from '@/services/duels';

export async function POST(req: Request) {
  const auth = await requireStudent();
  if ('error' in auth) return auth.error;
  const body = await req.json().catch(() => null);
  if (typeof body?.matchId !== 'string' || typeof body?.accept !== 'boolean') return fail(new Error('Dữ liệu không hợp lệ'));
  try {
    return NextResponse.json(await respondInvite(auth.profile.id, body.matchId, body.accept));
  } catch (e) {
    return fail(e);
  }
}
