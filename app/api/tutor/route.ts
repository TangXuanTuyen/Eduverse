import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentProfile } from '@/lib/auth/session';
import { handleTutorMessage, TutorError } from '@/services/ai-tutor';

const bodySchema = z.object({
  message: z.string().min(1).max(500),
  mode: z.enum(['lesson', 'assignment', 'review', 'companion']),
  conversationId: z.string().uuid().optional(),
  contextType: z.string().max(50).optional(),
  contextId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
  source: z.enum(['page', 'companion']).optional(),
});

export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'student') {
    return NextResponse.json({ error: 'Chưa đăng nhập hoặc không phải học sinh.' }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
  }

  try {
    const result = await handleTutorMessage({
      studentId: profile.id,
      message: body.message,
      mode: body.mode,
      conversationId: body.conversationId,
      contextType: body.contextType,
      contextId: body.contextId,
      roomId: body.roomId,
      source: body.source,
    });

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof TutorError) {
      const status = err.code === 'RATE_LIMITED' ? 429
        : err.code === 'AI_DISABLED' ? 403
        : 400;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    console.error('[tutor] Unexpected error:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống. Thử lại sau.' }, { status: 500 });
  }
}
