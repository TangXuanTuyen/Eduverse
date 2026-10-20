import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { gradeAnswer } from '@/services/adaptive-questions';
import { addToReviewQueue, markReviewCorrect } from '@/services/review-queue';
import { awardXp } from '@/services/xp';

export async function POST(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.answers)) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
  }

  const { challengeId, answers } = body as {
    challengeId: string;
    answers: Array<{
      sourceQuestionId: string;
      answer: unknown;
      fromReview?: boolean;
      reviewId?: string;
    }>;
  };

  const results: Array<{
    sourceQuestionId: string;
    isCorrect: boolean;
    explanation: string;
  }> = [];

  let correctCount = 0;

  for (const a of answers) {
    const { isCorrect, explanation } = await gradeAnswer(a.sourceQuestionId, a.answer);
    results.push({ sourceQuestionId: a.sourceQuestionId, isCorrect, explanation });

    if (isCorrect) {
      correctCount++;
      if (a.fromReview && a.reviewId) {
        await markReviewCorrect(a.reviewId, profile.id);
        await awardXp(profile.id, 'review_fix', a.reviewId);
      }
    } else {
      await addToReviewQueue(profile.id, a.sourceQuestionId);
    }
  }

  // Award game completion XP
  const gameResult = await awardXp(profile.id, 'game_complete', `quick::${challengeId}`);

  // Perfect bonus
  let perfectResult = null;
  if (correctCount === answers.length && answers.length >= 5) {
    perfectResult = await awardXp(profile.id, 'perfect_quick', `perfect::${challengeId}`);
  }

  return NextResponse.json({
    results,
    correctCount,
    totalQuestions: answers.length,
    xp: {
      gameComplete: gameResult.awarded,
      perfectBonus: perfectResult?.awarded ?? 0,
      totalXp: perfectResult?.totalXp ?? gameResult.totalXp,
      level: perfectResult?.level ?? gameResult.level,
      capped: gameResult.capped,
      newBadges: [...gameResult.newBadges, ...(perfectResult?.newBadges ?? [])],
    },
  });
}
