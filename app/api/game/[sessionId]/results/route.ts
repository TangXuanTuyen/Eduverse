import { getCurrentProfile } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { getQuestionResults } from '@/services/game-sessions';

type Params = { params: Promise<{ sessionId: string }> };

export async function GET(req: Request, { params }: Params) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({}, { status: 403 });

  const { sessionId } = await params;
  const url = new URL(req.url);
  const questionId = url.searchParams.get('questionId');
  if (!questionId) return NextResponse.json({ error: 'Missing questionId' }, { status: 400 });

  try {
    const results = await getQuestionResults(sessionId, questionId);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json({}, { status: 500 });
  }
}
