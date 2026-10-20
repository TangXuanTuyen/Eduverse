import { getCurrentProfile } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { getLessonDetail, recordLessonEvent } from '@/services/lessons';
import type { QuestionBlock } from '@/lib/lessons/schema';

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
    let correct = false;

    if (qBlock.questionType === 'single_choice') {
      correct = answer === qBlock.correctAnswer;
    } else if (qBlock.questionType === 'short_answer') {
      const normalize = (v: unknown) => String(v ?? '').trim().toLowerCase();
      const accepted = Array.isArray(qBlock.correctAnswer)
        ? (qBlock.correctAnswer as string[]).map(normalize)
        : [normalize(qBlock.correctAnswer)];
      correct = accepted.includes(normalize(answer));
    }

    await recordLessonEvent(profile.id, lessonId, 'quiz_attempt', stepIndex, {
      blockIndex,
      answer,
      correct,
    });

    return NextResponse.json({
      correct,
      explanation: qBlock.explanation ?? '',
    });
  } catch {
    return NextResponse.json({}, { status: 500 });
  }
}
