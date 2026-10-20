'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { joinRoom } from '@/services/rooms';
import { getCurrentProfile } from '@/lib/auth/session';

const schema = z.object({
  code: z.string().trim().min(1, 'Nhập mã phòng').max(8).toUpperCase(),
});

export type JoinRoomState = { error?: string };

export async function joinRoomAction(
  _prev: JoinRoomState,
  formData: FormData
): Promise<JoinRoomState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'student') redirect('/login');

  const parsed = schema.safeParse({ code: formData.get('code') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Mã không hợp lệ' };

  try {
    await joinRoom(parsed.data.code);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Lỗi hệ thống';
    if (msg.includes('không hợp lệ')) return { error: 'Mã phòng không đúng. Kiểm tra lại nhé!' };
    if (msg.includes('hết hạn')) return { error: 'Mã phòng đã hết hạn. Hỏi thầy cô lấy mã mới.' };
    return { error: msg };
  }

  redirect('/student');
}
