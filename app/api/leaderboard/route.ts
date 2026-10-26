import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { getClassLeaderboard } from '@/services/student-progress';

export async function GET(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roomId = req.nextUrl.searchParams.get('roomId');
  if (!roomId) {
    return NextResponse.json({ error: 'roomId required' }, { status: 400 });
  }

  try {
    const leaderboard = await getClassLeaderboard(roomId, profile.id);
    return NextResponse.json({ leaderboard });
  } catch {
    return NextResponse.json({ leaderboard: [] });
  }
}
