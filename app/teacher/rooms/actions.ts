'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentProfile } from '@/lib/auth/session';
import { createRoom, refreshJoinCode } from '@/services/rooms';

const createSchema = z.object({
  name: z.string().trim().min(1, 'Nhập tên phòng').max(100),
  subject: z.string().trim().max(100).optional(),
  grade: z.coerce.number().int().min(6).max(9).optional(),
});

export type RoomActionState = { error?: string; success?: string };

export async function createRoomAction(
  _prev: RoomActionState,
  formData: FormData
): Promise<RoomActionState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') return { error: 'Không có quyền' };

  const parsed = createSchema.safeParse({
    name: formData.get('name'),
    subject: formData.get('subject'),
    grade: formData.get('grade') || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };

  try {
    const room = await createRoom(profile.id, parsed.data.name, parsed.data.subject, parsed.data.grade);
    revalidatePath('/teacher/rooms');
    return { success: `Đã tạo phòng! Mã vào: ${room.join_code}` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi hệ thống' };
  }
}

export async function refreshCodeAction(
  _prev: RoomActionState,
  formData: FormData
): Promise<RoomActionState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') return { error: 'Không có quyền' };

  const roomId = formData.get('roomId');
  if (typeof roomId !== 'string') return { error: 'Thiếu mã phòng' };

  try {
    const code = await refreshJoinCode(roomId, profile.id);
    revalidatePath('/teacher/rooms');
    return { success: `Mã mới: ${code}` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi hệ thống' };
  }
}
