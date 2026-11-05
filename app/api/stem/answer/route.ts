import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { getStemQuestion, gradeStemAnswer } from '@/lib/stem/quizzes';
import { addStemReviewItem } from '@/services/review-queue';

/** Bài STEM Maker báo câu học sinh vừa trả lời; máy chủ tự chấm và đưa câu sai vào Trạm Sửa Lỗi. */
export async function POST(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'student') {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const question = typeof body?.projectId === 'string' && typeof body?.questionId === 'string'
    ? getStemQuestion(body.projectId, body.questionId)
    : null;
  if (!question) return NextResponse.json({ error: 'Câu hỏi không hợp lệ' }, { status: 400 });

  const isCorrect = gradeStemAnswer(question, body.answer);
  if (!isCorrect) await addStemReviewItem(profile.id, body.projectId, body.questionId);
  return NextResponse.json({ isCorrect });
}
