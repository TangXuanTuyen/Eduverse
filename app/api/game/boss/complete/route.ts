import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { awardXp } from '@/services/xp';

export async function POST(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { sessionId } = body;

  if (!sessionId) {
    return NextResponse.json({ error: 'Thiếu sessionId' }, { status: 400 });
  }

  const result = await awardXp(profile.id, 'boss_clear', sessionId);

  return NextResponse.json({
    xpAwarded: result.awarded,
    totalXp: result.totalXp,
    level: result.level,
    capped: result.capped,
    newBadges: result.newBadges,
  });
}
