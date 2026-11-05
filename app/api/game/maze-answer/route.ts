import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { recordMazeAnswer } from '@/services/game-assignments';

export async function POST(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'student') {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const selectedIndex = Number(body?.selectedIndex);
  if (!body?.assignmentId || !body?.questionId || !Number.isInteger(selectedIndex)) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
  }

  try {
    const result = await recordMazeAnswer(profile.id, body.assignmentId, body.questionId, selectedIndex);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Lỗi' }, { status: 400 });
  }
}
