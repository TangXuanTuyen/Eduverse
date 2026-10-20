import { getCurrentProfile } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { submitAnswer } from '@/services/game-sessions';

type Params = { params: Promise<{ sessionId: string }> };

export async function POST(req: Request, { params }: Params) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({}, { status: 403 });

  const { sessionId } = await params;
  const body = await req.json();
  const { questionId, answer } = body;

  if (!questionId) return NextResponse.json({ error: 'Missing questionId' }, { status: 400 });

  try {
    const result = await submitAnswer(sessionId, profile.id, questionId, answer);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Lỗi gửi đáp án' },
      { status: 400 }
    );
  }
}
