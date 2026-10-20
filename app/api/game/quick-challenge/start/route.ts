import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { selectQuestions } from '@/services/adaptive-questions';

export async function POST(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const skillTags = Array.isArray(body.skillTags) ? body.skillTags : undefined;

  const questions = await selectQuestions({
    studentId: profile.id,
    count: 5,
    mode: 'adaptive',
    skillTags,
  });

  if (questions.length === 0) {
    return NextResponse.json({ error: 'Không có câu hỏi phù hợp' }, { status: 404 });
  }

  // Return questions without correct answers
  const challengeId = crypto.randomUUID();
  return NextResponse.json({
    challengeId,
    questions: questions.map((q) => ({
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
