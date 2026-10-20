'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/auth/session';
import { assignExperiment } from '@/services/lab-assignments';

export async function assignExperimentAction(
  experimentId: string,
  roomId: string,
  dueAt?: string
) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') return { error: 'Không có quyền' };

  try {
    await assignExperiment(profile.id, experimentId, roomId, dueAt);
    revalidatePath('/teacher/labs');
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi giao thí nghiệm' };
  }
}
