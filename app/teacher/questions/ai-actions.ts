'use server';

import { getCurrentProfile } from '@/lib/auth/session';
import { generateQuestions, type GenerateParams } from '@/services/ai-questions';
import { createQuestion, type CreateQuestionData } from '@/services/questions';
import { revalidatePath } from 'next/cache';

export type AIGenerateState = {
  error?: string;
  questions?: CreateQuestionData[];
  saved?: number;
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
  const type = (formData.get('type') as string) || 'single_choice';
  const difficulty = Number(formData.get('difficulty')) || 1;
  const count = Math.min(Math.max(Number(formData.get('count')) || 5, 1), 20);

  if (!topic) return { error: 'Nhập chủ đề bài học' };
  if (!subject) return { error: 'Chọn môn học' };

  try {
    const questions = await generateQuestions({
      subject,
      grade,
      topic,
      type: type as GenerateParams['type'],
      difficulty,
      count,
    });
    return { questions };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi tạo câu hỏi AI' };
  }
}

export async function saveAIQuestionsAction(
  questionsJson: string
): Promise<{ error?: string; saved?: number }> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') return { error: 'Không có quyền' };

  try {
    const questions: CreateQuestionData[] = JSON.parse(questionsJson);
    if (!Array.isArray(questions) || questions.length === 0) return { error: 'Không có câu hỏi' };

    let saved = 0;
    for (const q of questions) {
      await createQuestion(profile.id, q);
      saved++;
    }
    revalidatePath('/teacher/questions');
    return { saved };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi lưu câu hỏi' };
  }
}
