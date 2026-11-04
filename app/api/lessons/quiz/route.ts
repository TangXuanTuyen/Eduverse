import { getCurrentProfile } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { getLessonDetail, recordLessonEvent } from '@/services/lessons';
import type { QuestionBlock } from '@/lib/lessons/schema';
import { gradeLessonQuestion, isReviewableLessonQuestion } from '@/lib/lessons/grade';
import { addLessonReviewItem } from '@/services/review-queue';

export async function POST(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({}, { status: 401 });

  const { lessonId, stepIndex, blockIndex, answer } = await req.json();
  if (!lessonId || stepIndex === undefined || blockIndex === undefined) {
    return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
  }

  try {
    const lesson = await getLessonDetail(lessonId);
    const step = lesson.content[stepIndex];
    if (!step) return NextResponse.json({ error: 'Bước không tồn tại' }, { status: 400 });
    const block = step.blocks[blockIndex];
    if (!block || block.type !== 'question') {
      return NextResponse.json({ error: 'Không phải câu hỏi' }, { status: 400 });
    }

    const qBlock = block as QuestionBlock;
    const correct = gradeLessonQuestion(qBlock, answer);

    await recordLessonEvent(profile.id, lessonId, 'quiz_attempt', stepIndex, {
      blockIndex,
      answer,
      correct,
    });

    // Câu sai đưa vào Trạm Sửa Lỗi của chính học sinh này
    if (!correct && isReviewableLessonQuestion(qBlock)) {
      await addLessonReviewItem(profile.id, lessonId, stepIndex, blockIndex, qBlock);
    }

    return NextResponse.json({
      correct,
      explanation: qBlock.explanation ?? '',
    });
  } catch {
    return NextResponse.json({}, { status: 500 });
  }
}
