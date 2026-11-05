import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { finishSoloSession } from '@/services/game-assignments';

export async function POST(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const { sessionId } = (await req.json().catch(() => ({}))) as { sessionId?: string };
  if (!sessionId) return NextResponse.json({ error: 'Thiếu sessionId' }, { status: 400 });

  try {
    await finishSoloSession(sessionId, profile.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Lỗi' }, { status: 400 });
  }
}
