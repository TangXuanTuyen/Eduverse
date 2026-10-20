import { getCurrentProfile } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { joinSession } from '@/services/game-sessions';

export async function POST(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 403 });

  const body = await req.json();
  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
  if (!code) return NextResponse.json({ error: 'Nhập mã trò chơi' }, { status: 400 });

  try {
    const result = await joinSession(code, profile.id, profile.displayName || 'Học sinh');
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Lỗi tham gia' },
      { status: 400 }
    );
  }
}
