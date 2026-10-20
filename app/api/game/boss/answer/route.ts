import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { gradeAnswer } from '@/services/adaptive-questions';
import { addToReviewQueue, markReviewCorrect } from '@/services/review-queue';
import { awardXp } from '@/services/xp';

export async function POST(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.sourceQuestionId) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
  }

  const { sourceQuestionId, answer, fromReview, reviewId } = body;
  const { isCorrect, explanation } = await gradeAnswer(sourceQuestionId, answer);

  if (isCorrect) {
    if (fromReview && reviewId) {
      await markReviewCorrect(reviewId, profile.id);
      await awardXp(profile.id, 'review_fix', reviewId);
    }
  } else {
    await addToReviewQueue(profile.id, sourceQuestionId);
  }

  return NextResponse.json({
    isCorrect,
    explanation,
  });
}
