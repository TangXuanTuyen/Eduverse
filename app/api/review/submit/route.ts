import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { gradeAnswer } from '@/services/adaptive-questions';
import { getLessonDetail } from '@/services/lessons';
import { gradeLessonQuestion } from '@/lib/lessons/grade';
import type { QuestionBlock } from '@/lib/lessons/schema';
import { getStemQuestion, gradeStemAnswer } from '@/lib/stem/quizzes';
import { getReviewItemForStudent, markReviewCorrect, markReviewWrong } from '@/services/review-queue';
import { awardXp } from '@/services/xp';

export async function POST(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.reviewId) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
  }

  // Nguồn câu hỏi lấy từ chính dòng của học sinh, không tin dữ liệu gửi lên
  const item = await getReviewItemForStudent(body.reviewId, profile.id);
  if (!item) return NextResponse.json({ error: 'Không tìm thấy câu cần ôn' }, { status: 404 });

  const { answer } = body;
  let isCorrect: boolean;
  let explanation: string;

  if (item.sourceQuestionId) {
    ({ isCorrect, explanation } = await gradeAnswer(item.sourceQuestionId, answer));
  } else if (item.sourceLessonId && item.sourceBlockKey) {
    const [stepIndex, blockIndex] = item.sourceBlockKey.split(':').map(Number);
    const lesson = await getLessonDetail(item.sourceLessonId);
    const block = lesson.content[stepIndex]?.blocks[blockIndex];
    if (!block || block.type !== 'question') {
      return NextResponse.json({ error: 'Câu hỏi không còn trong bài học' }, { status: 410 });
    }
    const qBlock = block as QuestionBlock;
    isCorrect = gradeLessonQuestion(qBlock, answer);
    explanation = qBlock.explanation ?? '';
  } else if (item.sourceStemProject && item.sourceStemQuestion) {
    const stemQuestion = getStemQuestion(item.sourceStemProject, item.sourceStemQuestion);
    if (!stemQuestion) {
      return NextResponse.json({ error: 'Câu hỏi không còn trong bài' }, { status: 410 });
    }
    isCorrect = gradeStemAnswer(stemQuestion, answer);
    explanation = stemQuestion.explanation;
  } else {
    return NextResponse.json({ error: 'Câu hỏi không hợp lệ' }, { status: 400 });
  }

  let xpAwarded = 0;
  let nextReviewAt: string | null = null;

  if (isCorrect) {
    const result = await markReviewCorrect(body.reviewId, profile.id);
    nextReviewAt = result.nextReviewAt;
    const xpResult = await awardXp(profile.id, 'review_fix', body.reviewId);
    xpAwarded = xpResult.awarded;
  } else {
    await markReviewWrong(body.reviewId, profile.id);
  }

  return NextResponse.json({
    isCorrect,
    explanation,
    xpAwarded,
    nextReviewAt,
  });
}
