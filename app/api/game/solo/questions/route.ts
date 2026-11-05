import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { getSoloQuestions } from '@/services/game-assignments';

export async function GET(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const sessionId = new URL(req.url).searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ error: 'Thiếu sessionId' }, { status: 400 });

  try {
    const questions = await getSoloQuestions(sessionId, profile.id);
    return NextResponse.json({ questions });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Lỗi' }, { status: 400 });
  }
}
