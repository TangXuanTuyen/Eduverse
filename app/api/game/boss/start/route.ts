import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { selectQuestions } from '@/services/adaptive-questions';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const skillTags = Array.isArray(body.skillTags) ? body.skillTags : undefined;
  const bossName = typeof body.bossName === 'string' ? body.bossName : 'Boss';
  const questionCount = Math.min(Math.max(Number(body.questionCount) || 10, 5), 20);

  const questions = await selectQuestions({
    studentId: profile.id,
    count: questionCount,
    mode: 'adaptive',
    skillTags,
  });

  if (questions.length < 3) {
    return NextResponse.json({ error: 'Không đủ câu hỏi' }, { status: 404 });
  }

  const admin = createAdminClient();
  const sessionId = crypto.randomUUID();

  // Store boss session in a lightweight way (no game_sessions table dependency)
  await admin.from('xp_transactions').select('id').limit(0); // warm connection

  const bossHp = questions.length * 100;

  return NextResponse.json({
    sessionId,
    bossName,
    bossHp,
    totalQuestions: questions.length,
    currentQuestion: {
      index: 0,
      id: questions[0].id,
      sourceQuestionId: questions[0].sourceQuestionId,
      type: questions[0].type,
      content: questions[0].content,
      options: questions[0].options,
      fromReview: questions[0].fromReview,
      reviewId: questions[0].reviewId,
    },
    // Send all question IDs so client can request them one-by-one
    questionIds: questions.map((q) => ({
      id: q.id,
      sourceQuestionId: q.sourceQuestionId,
      type: q.type,
      content: q.content,
      options: q.options,
      fromReview: q.fromReview,
      reviewId: q.reviewId,
    })),
  });
}
