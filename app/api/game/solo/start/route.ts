import { getCurrentProfile } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { startSoloSession } from '@/services/game-assignments';

export async function POST(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const { gameId } = await req.json();
  if (!gameId) return NextResponse.json({ error: 'Thiếu gameId' }, { status: 400 });

  try {
    const result = await startSoloSession(gameId, profile.id, profile.displayName);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Lỗi' },
      { status: 400 }
    );
  }
}
