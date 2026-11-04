import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { explainBodySchema, explainVoltaCell, StemExplainError } from '@/services/stem-explain';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== 'student' && profile.role !== 'teacher')) {
    return NextResponse.json({ error: 'Cần đăng nhập để dùng trợ lý.' }, { status: 401 });
  }

  const parsed = explainBodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
  }

  try {
    const explanation = await explainVoltaCell(profile.id, parsed.data);
    return NextResponse.json({ explanation });
  } catch (err) {
    if (err instanceof StemExplainError) {
      const status = err.code === 'INVALID_INPUT' ? 400 : err.code === 'RATE_LIMITED' ? 429 : 503;
      return NextResponse.json({ error: err.message }, { status });
    }
    console.error('[stem/explain] Unexpected error:', err);
    return NextResponse.json({ error: 'Không thể xử lý câu trả lời lúc này.' }, { status: 500 });
  }
}
