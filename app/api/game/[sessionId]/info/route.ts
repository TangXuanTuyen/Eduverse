import { getCurrentProfile } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { getSessionPlayers } from '@/services/game-sessions';
import { createAdminClient } from '@/lib/supabase/admin';

type Params = { params: Promise<{ sessionId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({}, { status: 403 });

  const { sessionId } = await params;
  const admin = createAdminClient();

  const { data: session } = await admin
    .from('game_sessions')
    .select('join_code, game_id')
    .eq('id', sessionId)
    .single();
  if (!session) return NextResponse.json({}, { status: 404 });

  const players = await getSessionPlayers(sessionId);

  const { count } = await admin
    .from('game_questions')
    .select('id', { count: 'exact', head: true })
    .eq('game_id', session.game_id);

  return NextResponse.json({
    joinCode: session.join_code,
    players: players.map((p) => ({ display_name: p.display_name, total_score: p.total_score })),
    totalQuestions: count ?? 0,
  });
}
