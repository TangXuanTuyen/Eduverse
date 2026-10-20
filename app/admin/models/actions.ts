'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/auth/session';
import { createModel, deleteModel, toggleModelPublish } from '@/services/models-3d';

function requireAdmin(profile: { role: string | null } | null) {
  if (!profile || profile.role !== 'admin') throw new Error('Không có quyền');
}

export async function createModelAction(_prev: unknown, formData: FormData) {
  const profile = await getCurrentProfile();
  requireAdmin(profile);

  const title = (formData.get('title') as string)?.trim();
  if (!title) return { error: 'Nhập tên mô hình' };

  const embedUrl = (formData.get('embed_url') as string)?.trim();
  if (!embedUrl) return { error: 'Nhập URL embed' };

  try {
    const id = await createModel(profile!.id, {
      title,
      description: (formData.get('description') as string)?.trim() || '',
      category: (formData.get('category') as string) || 'khac',
      subject: (formData.get('subject') as string) || 'khtn_chung',
      grade_level: Number(formData.get('grade_level')) || 6,
      thumbnail_url: (formData.get('thumbnail_url') as string)?.trim() || undefined,
      embed_url: embedUrl,
      embed_type: (formData.get('embed_type') as string) || 'iframe',
    });
    revalidatePath('/admin/models');
    return { success: true, modelId: id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi tạo mô hình' };
  }
}

export async function toggleModelPublishAction(id: string) {
  const profile = await getCurrentProfile();
  requireAdmin(profile);

  try {
    const newState = await toggleModelPublish(id);
    revalidatePath('/admin/models');
    return { success: true, isPublished: newState };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi' };
  }
}

export async function deleteModelAction(id: string) {
  const profile = await getCurrentProfile();
  requireAdmin(profile);

  try {
    await deleteModel(id);
    revalidatePath('/admin/models');
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi xóa' };
  }
}
