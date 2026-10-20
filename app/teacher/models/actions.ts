'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/auth/session';
import { assignModel } from '@/services/models-3d';

export async function assignModelAction(modelId: string, roomId: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') return { error: 'Không có quyền' };

  try {
    await assignModel(profile.id, modelId, roomId);
    revalidatePath('/teacher/models');
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi giao mô hình' };
  }
}
