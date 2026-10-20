'use server';

import { getCurrentProfile } from '@/lib/auth/session';
import { createQuestionSet } from '@/services/question-sets';
import { revalidatePath } from 'next/cache';

export async function createSetAction(
  name: string,
  questionIds: string[]
): Promise<{ error?: string; success?: boolean }> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') return { error: 'Không có quyền' };

  if (!name.trim()) return { error: 'Nhập tên bộ đề' };
  if (questionIds.length === 0) return { error: 'Chọn ít nhất 1 câu hỏi' };

  try {
    await createQuestionSet(profile.id, {
      name: name.trim(),
      question_ids: questionIds,
    });
    revalidatePath('/teacher/questions');
    revalidatePath('/teacher/assignments');
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi tạo bộ đề' };
  }
}
