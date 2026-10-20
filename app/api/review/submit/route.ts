import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { gradeAnswer } from '@/services/adaptive-questions';
import { markReviewCorrect, markReviewWrong } from '@/services/review-queue';
import { awardXp } from '@/services/xp';

export async function POST(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.reviewId || !body?.sourceQuestionId) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
  }

  const { reviewId, sourceQuestionId, answer } = body;
  const { isCorrect, explanation } = await gradeAnswer(sourceQuestionId, answer);

  let xpAwarded = 0;
  let nextReviewAt: string | null = null;

  if (isCorrect) {
    const result = await markReviewCorrect(reviewId, profile.id);
    nextReviewAt = result.nextReviewAt;
    const xpResult = await awardXp(profile.id, 'review_fix', reviewId);
    xpAwarded = xpResult.awarded;
  } else {
    await markReviewWrong(reviewId, profile.id);
  }

  return NextResponse.json({
    isCorrect,
    explanation,
    xpAwarded,
    nextReviewAt,
  });
}
