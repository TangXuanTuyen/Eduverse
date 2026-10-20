import { getCurrentProfile } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { soloNextQuestion } from '@/services/game-assignments';

export async function POST(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const { sessionId } = await req.json();
  if (!sessionId) return NextResponse.json({ error: 'Thiếu sessionId' }, { status: 400 });

  try {
    const result = await soloNextQuestion(sessionId, profile.id);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Lỗi' },
      { status: 400 }
    );
  }
}
