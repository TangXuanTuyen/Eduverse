'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/auth/session';
import { assignLesson } from '@/services/lessons';

export async function assignLessonAction(lessonId: string, roomId: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') return { error: 'Không có quyền' };

  try {
    await assignLesson(profile.id, lessonId, roomId);
    revalidatePath('/teacher/lessons');
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi giao bài' };
  }
}
