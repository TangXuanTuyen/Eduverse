'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/auth/session';
import {
  createExperiment,
  updateExperiment,
  deleteExperiment,
  togglePublish,
} from '@/services/experiments';

function requireAdmin(profile: { role: string | null } | null) {
  if (!profile || profile.role !== 'admin') throw new Error('Không có quyền');
}

export async function createExperimentAction(_prev: unknown, formData: FormData) {
  const profile = await getCurrentProfile();
  requireAdmin(profile);

  const title = (formData.get('title') as string)?.trim();
  if (!title) return { error: 'Nhập tên thí nghiệm' };

  const subject = (formData.get('subject') as string) || 'khtn_chung';
  const gradeLevel = Number(formData.get('grade_level')) || 6;
  const embedUrl = (formData.get('embed_url') as string)?.trim() || undefined;
  const componentKey = (formData.get('component_key') as string)?.trim() || undefined;
  const durationMinutes = Number(formData.get('duration_minutes')) || 15;
  const difficulty = Number(formData.get('difficulty')) || 1;
  const thumbnailUrl = (formData.get('thumbnail_url') as string)?.trim() || undefined;
  const description = (formData.get('description') as string)?.trim() || '';

  if (!embedUrl && !componentKey) return { error: 'Cần URL embed hoặc component key' };

  try {
    const id = await createExperiment(profile!.id, {
      title,
      description,
      subject,
      grade_level: gradeLevel,
      embed_url: embedUrl,
      component_key: componentKey,
      thumbnail_url: thumbnailUrl,
      duration_minutes: durationMinutes,
      difficulty,
    });
    revalidatePath('/admin/experiments');
    return { success: true, experimentId: id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi tạo thí nghiệm' };
  }
}

export async function updateExperimentAction(id: string, formData: FormData) {
  const profile = await getCurrentProfile();
  requireAdmin(profile);

  const data: Record<string, unknown> = {};
  const title = formData.get('title') as string;
  if (title?.trim()) data.title = title.trim();
  const description = formData.get('description') as string;
  if (description !== null) data.description = description?.trim() ?? '';
  const subject = formData.get('subject') as string;
  if (subject) data.subject = subject;
  const gradeLevel = formData.get('grade_level');
  if (gradeLevel) data.grade_level = Number(gradeLevel);
  const embedUrl = formData.get('embed_url') as string;
  if (embedUrl !== null) data.embed_url = embedUrl?.trim() || undefined;
  const componentKey = formData.get('component_key') as string;
  if (componentKey !== null) data.component_key = componentKey?.trim() || undefined;
  const durationMinutes = formData.get('duration_minutes');
  if (durationMinutes) data.duration_minutes = Number(durationMinutes);
  const difficulty = formData.get('difficulty');
  if (difficulty) data.difficulty = Number(difficulty);
  const thumbnailUrl = formData.get('thumbnail_url') as string;
  if (thumbnailUrl !== null) data.thumbnail_url = thumbnailUrl?.trim() || undefined;

  try {
    await updateExperiment(id, data);
    revalidatePath('/admin/experiments');
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi cập nhật' };
  }
}

export async function togglePublishAction(id: string) {
  const profile = await getCurrentProfile();
  requireAdmin(profile);

  try {
    const newState = await togglePublish(id);
    revalidatePath('/admin/experiments');
    return { success: true, isPublished: newState };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi' };
  }
}

export async function deleteExperimentAction(id: string) {
  const profile = await getCurrentProfile();
  requireAdmin(profile);

  try {
    await deleteExperiment(id);
    revalidatePath('/admin/experiments');
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi xóa' };
  }
}
