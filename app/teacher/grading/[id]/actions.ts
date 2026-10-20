'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/auth/session';
import { gradeAttempt, finalizeGrading } from '@/services/grading';

export async function gradeAttemptAction(
  attemptId: string,
  score: number,
  feedback: string | null
): Promise<{ error?: string }> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') return { error: 'Không có quyền' };

  try {
    await gradeAttempt(attemptId, profile.id, score, feedback);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi hệ thống' };
  }
}

export async function finalizeAction(
  submissionId: string
): Promise<{ error?: string; success?: string }> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') return { error: 'Không có quyền' };

  try {
    await finalizeGrading(submissionId, profile.id);
    revalidatePath('/teacher/grading');
    return { success: 'Đã hoàn tất chấm bài!' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi hệ thống' };
  }
}
