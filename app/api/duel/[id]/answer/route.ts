import { NextResponse } from 'next/server';
import { requireStudent, fail } from '@/lib/duel/api';
import { submitDuelAnswer } from '@/services/duels';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStudent();
  if ('error' in auth) return auth.error;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const index = Number(body?.index);
  const selectedIndex = Number(body?.selectedIndex);
  if (!Number.isInteger(index) || !Number.isInteger(selectedIndex)) return fail(new Error('Dữ liệu không hợp lệ'));
  try {
    return NextResponse.json(await submitDuelAnswer(auth.profile.id, id, index, selectedIndex));
  } catch (e) {
    return fail(e);
  }
}
