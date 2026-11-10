import { NextResponse } from 'next/server';
import { requireStudent, fail } from '@/lib/duel/api';
import { getInbox } from '@/services/duels';

export async function GET() {
  const auth = await requireStudent();
  if ('error' in auth) return auth.error;
  try {
    return NextResponse.json({ invites: await getInbox(auth.profile.id) });
  } catch (e) {
    return fail(e);
  }
}
