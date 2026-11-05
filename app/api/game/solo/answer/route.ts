import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { answerSoloQuestion } from '@/services/game-assignments';

export async function POST(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.sessionId || !body?.questionId) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
  }

  try {
    const result = await answerSoloQuestion(body.sessionId, profile.id, body.questionId, body.answer);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Lỗi' }, { status: 400 });
  }
}
