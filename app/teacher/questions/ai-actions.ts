'use server';

import { getCurrentProfile } from '@/lib/auth/session';
import { generateQuestions, type GenerateParams } from '@/services/ai-questions';
import { createQuestion, type CreateQuestionData } from '@/services/questions';
import { createQuestionSet } from '@/services/question-sets';
import { revalidatePath } from 'next/cache';

export type AIGenerateState = {
  error?: string;
  questions?: CreateQuestionData[];
  saved?: number;
  setName?: string;
};

export async function generateQuestionsAction(
  _prev: AIGenerateState,
  formData: FormData
): Promise<AIGenerateState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') return { error: 'Không có quyền' };

  const subject = formData.get('subject') as string;
  const grade = Number(formData.get('grade')) || 6;
  const topic = (formData.get('topic') as string)?.trim();
  const types = formData.getAll('types') as string[];
  const difficulties = formData.getAll('difficulties').map(Number).filter((d) => d >= 1 && d <= 3);
  const count = Math.min(Math.max(Number(formData.get('count')) || 5, 1), 20);

  if (!topic) return { error: 'Nhập chủ đề bài học' };
  if (!subject) return { error: 'Chọn môn học' };
  if (types.length === 0) return { error: 'Chọn ít nhất một loại câu hỏi' };
  if (difficulties.length === 0) return { error: 'Chọn ít nhất một độ khó' };

  if (!process.env.GEMINI_API_KEY) {
    return { error: 'Chưa cấu hình GEMINI_API_KEY trên server' };
  }

  try {
    const questions = await generateQuestions({
      subject,
      grade,
      topic,
      types: types as GenerateParams['types'],
      difficulties,
      count,
    });
    return { questions };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Lỗi tạo câu hỏi AI';
    console.error('[AI Generate]', msg);
    return { error: msg };
  }
}

export async function saveAIQuestionsAction(
  questionsJson: string,
  setName: string
): Promise<{ error?: string; saved?: number; setName?: string }> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') return { error: 'Không có quyền' };

  try {
    const questions: CreateQuestionData[] = JSON.parse(questionsJson);
    if (!Array.isArray(questions) || questions.length === 0) return { error: 'Không có câu hỏi' };

    const questionIds: string[] = [];
    for (const q of questions) {
      const id = await createQuestion(profile.id, q);
      questionIds.push(id);
    }

    await createQuestionSet(profile.id, {
      name: setName.trim() || `Bộ đề AI - ${new Date().toLocaleDateString('vi-VN')}`,
      question_ids: questionIds,
    });

    revalidatePath('/teacher/questions');
    revalidatePath('/teacher/assignments');
    return { saved: questionIds.length, setName };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi lưu câu hỏi' };
  }
}
