'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentProfile } from '@/lib/auth/session';
import { createQuestion, updateQuestion, deleteQuestion, importQuestions, type CreateQuestionData } from '@/services/questions';

const QUESTION_TYPES = ['single_choice', 'multiple_choice', 'short_answer', 'essay'] as const;

const questionSchema = z.object({
  type: z.enum(QUESTION_TYPES),
  content: z.string().trim().min(1, 'Nhập nội dung câu hỏi').max(10000),
  options: z.string().optional(),
  correct_answer: z.string().optional(),
  skill_tags: z.string().optional(),
  difficulty: z.coerce.number().int().min(1).max(3).default(1),
  explanation: z.string().max(5000).default(''),
});

export type QuestionActionState = { error?: string; success?: string };

function parseOptions(raw: string | undefined): { id: string; text: string }[] | null {
  if (!raw?.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw.split('\n').filter(Boolean).map((text, i) => ({
      id: String.fromCharCode(97 + i),
      text: text.trim(),
    }));
  }
}

function parseAnswer(raw: string | undefined, type: string): unknown {
  if (!raw?.trim()) return null;
  if (type === 'essay') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw.trim();
  }
}

function parseTags(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
}

export async function createQuestionAction(
  _prev: QuestionActionState,
  formData: FormData
): Promise<QuestionActionState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') return { error: 'Không có quyền' };

  const parsed = questionSchema.safeParse({
    type: formData.get('type'),
    content: formData.get('content'),
    options: formData.get('options'),
    correct_answer: formData.get('correct_answer'),
    skill_tags: formData.get('skill_tags'),
    difficulty: formData.get('difficulty') || 1,
    explanation: formData.get('explanation') || '',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };

  const { type, content, options, correct_answer, skill_tags, difficulty, explanation } = parsed.data;

  try {
    await createQuestion(profile.id, {
      type,
      content,
      options: parseOptions(options),
      correct_answer: parseAnswer(correct_answer, type),
      skill_tags: parseTags(skill_tags),
      difficulty,
      explanation,
    });
    revalidatePath('/teacher/questions');
    return { success: 'Đã tạo câu hỏi!' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi hệ thống' };
  }
}

export async function updateQuestionAction(
  _prev: QuestionActionState,
  formData: FormData
): Promise<QuestionActionState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') return { error: 'Không có quyền' };

  const questionId = formData.get('questionId');
  if (typeof questionId !== 'string') return { error: 'Thiếu ID câu hỏi' };

  const parsed = questionSchema.safeParse({
    type: formData.get('type'),
    content: formData.get('content'),
    options: formData.get('options'),
    correct_answer: formData.get('correct_answer'),
    skill_tags: formData.get('skill_tags'),
    difficulty: formData.get('difficulty') || 1,
    explanation: formData.get('explanation') || '',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };

  const { type, content, options, correct_answer, skill_tags, difficulty, explanation } = parsed.data;

  try {
    await updateQuestion(questionId, profile.id, {
      type,
      content,
      options: parseOptions(options),
      correct_answer: parseAnswer(correct_answer, type),
      skill_tags: parseTags(skill_tags),
      difficulty,
      explanation,
    });
    revalidatePath('/teacher/questions');
    return { success: 'Đã cập nhật!' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi hệ thống' };
  }
}

export async function deleteQuestionAction(
  _prev: QuestionActionState,
  formData: FormData
): Promise<QuestionActionState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') return { error: 'Không có quyền' };

  const questionId = formData.get('questionId');
  if (typeof questionId !== 'string') return { error: 'Thiếu ID câu hỏi' };

  try {
    await deleteQuestion(questionId, profile.id);
    revalidatePath('/teacher/questions');
    return { success: 'Đã xóa câu hỏi' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi hệ thống' };
  }
}

export async function importQuestionsAction(
  _prev: QuestionActionState,
  formData: FormData
): Promise<QuestionActionState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') return { error: 'Không có quyền' };

  const raw = formData.get('data');
  if (typeof raw !== 'string') return { error: 'Thiếu dữ liệu' };

  try {
    const rows: CreateQuestionData[] = JSON.parse(raw);
    if (!Array.isArray(rows) || rows.length === 0) return { error: 'Không có câu hỏi nào' };
    if (rows.length > 100) return { error: 'Tối đa 100 câu hỏi mỗi lần nhập' };

    const ids = await importQuestions(profile.id, rows);
    revalidatePath('/teacher/questions');
    return { success: `Đã nhập ${ids.length} câu hỏi!` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Dữ liệu không hợp lệ' };
  }
}
