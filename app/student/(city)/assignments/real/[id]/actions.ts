'use server';

import { getCurrentProfile } from '@/lib/auth/session';
import { saveDraft, submitAssignment } from '@/services/submissions';
import { revalidatePath } from 'next/cache';

export type TakerActionState = { error?: string; success?: string; result?: Record<string, unknown> };

export async function saveDraftAction(
  submissionId: string,
  answers: Record<string, unknown>
): Promise<{ error?: string }> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'student') return { error: 'Không có quyền' };

  try {
    await saveDraft(submissionId, profile.id, answers);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi lưu bài' };
  }
}

export async function submitAction(
  submissionId: string
): Promise<TakerActionState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'student') return { error: 'Không có quyền' };

  try {
    const result = await submitAssignment(submissionId, profile.id);
    revalidatePath('/student/assignments');
    return { success: 'Đã nộp bài!', result: result as unknown as Record<string, unknown> };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi nộp bài' };
  }
}
