import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getCurrentProfile } from '@/lib/auth/session';
import { handleTutorStream, TutorError } from '@/services/ai-tutor';
import { AIOverloadError } from '@/lib/ai/provider';

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
    return Response.json({ error: 'Chưa đăng nhập hoặc không phải học sinh.' }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return Response.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
  }

  try {
    const { stream, conversationId, remainingQuota } = await handleTutorStream({
      studentId: profile.id,
      message: body.message,
      mode: body.mode,
      conversationId: body.conversationId,
      contextType: body.contextType,
      contextId: body.contextId,
      roomId: body.roomId,
      source: body.source,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        // Send metadata first
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'meta', conversationId, remainingQuota })}\n\n`));

        try {
          let result = await stream.next();
          while (!result.done) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text: result.value })}\n\n`));
            result = await stream.next();
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        } catch (err) {
          const msg = err instanceof AIOverloadError
            ? err.message
            : 'Lỗi hệ thống. Thử lại sau.';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: msg })}\n\n`));
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    if (err instanceof TutorError) {
      const status = err.code === 'RATE_LIMITED' ? 429
        : err.code === 'AI_DISABLED' ? 403
        : 400;
      return Response.json({ error: err.message, code: err.code }, { status });
    }
    if (err instanceof AIOverloadError) {
      return Response.json({ error: err.message, code: 'AI_OVERLOADED' }, { status: 503 });
    }
    console.error('[tutor/stream] Unexpected error:', err);
    return Response.json({ error: 'Lỗi hệ thống. Thử lại sau.' }, { status: 500 });
  }
}
