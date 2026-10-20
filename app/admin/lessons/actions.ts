'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/auth/session';
import { createLesson, updateLesson, deleteLesson } from '@/services/lessons';
import { lessonContentSchema } from '@/lib/lessons/schema';

export async function createLessonAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') return { error: 'Không có quyền' };

  const title = (formData.get('title') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() ?? '';
  const subject = formData.get('subject') as string;
  const grade = Number(formData.get('grade_level')) || 6;
  const chapter = (formData.get('chapter') as string)?.trim() ?? '';
  const contentJson = (formData.get('content') as string) ?? '[]';

  if (!title) return { error: 'Nhập tiêu đề' };
  if (!subject) return { error: 'Chọn môn học' };

  try {
    const content = lessonContentSchema.parse(JSON.parse(contentJson));
    const id = await createLesson({
      title, description, subject, grade_level: grade,
      chapter, content, created_by: profile.id,
    });
    revalidatePath('/admin/lessons');
    return { success: true, id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi tạo bài học' };
  }
}

export async function toggleLessonPublishAction(lessonId: string, currentStatus: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') return { error: 'Không có quyền' };

  try {
    await updateLesson(lessonId, {
      status: currentStatus === 'published' ? 'draft' : 'published',
    });
    revalidatePath('/admin/lessons');
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi' };
  }
}

export async function deleteLessonAction(lessonId: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') return { error: 'Không có quyền' };

  try {
    await deleteLesson(lessonId);
    revalidatePath('/admin/lessons');
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi xóa' };
  }
}
