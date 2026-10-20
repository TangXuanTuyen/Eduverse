import { getCurrentProfile } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/services/game-sessions';

type Params = { params: Promise<{ sessionId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({}, { status: 403 });

  const { sessionId } = await params;

  try {
    const leaderboard = await getLeaderboard(sessionId);
    return NextResponse.json({ leaderboard });
  } catch {
    return NextResponse.json({}, { status: 500 });
  }
}
