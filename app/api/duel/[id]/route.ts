import { NextResponse } from 'next/server';
import { requireStudent, fail } from '@/lib/duel/api';
import { getDuelState } from '@/services/duels';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStudent();
  if ('error' in auth) return auth.error;
  const { id } = await params;
  try {
    return NextResponse.json(await getDuelState(auth.profile.id, id));
  } catch (e) {
    return fail(e, 404);
  }
}
