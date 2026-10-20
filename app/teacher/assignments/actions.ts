'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentProfile } from '@/lib/auth/session';
import { createAssignment } from '@/services/assignments';

const assignmentSchema = z.object({
  room_id: z.string().uuid('Chọn phòng'),
  title: z.string().trim().min(1, 'Nhập tiêu đề').max(200),
  description: z.string().max(2000).default(''),
  due_at: z.string().optional(),
  late_policy: z.enum(['hard_lock', 'marked_late']).default('hard_lock'),
  max_retries: z.coerce.number().int().min(0).max(10).default(0),
  show_explanation_after_submit: z.coerce.boolean().default(true),
  question_ids: z.string().min(1, 'Chọn ít nhất 1 câu hỏi'),
});

export type AssignmentActionState = { error?: string; success?: string };

export async function createAssignmentAction(
  _prev: AssignmentActionState,
  formData: FormData
): Promise<AssignmentActionState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') return { error: 'Không có quyền' };

  const parsed = assignmentSchema.safeParse({
    room_id: formData.get('room_id'),
    title: formData.get('title'),
    description: formData.get('description') || '',
    due_at: formData.get('due_at') || undefined,
    late_policy: formData.get('late_policy') || 'hard_lock',
    max_retries: formData.get('max_retries') || 0,
    show_explanation_after_submit: formData.get('show_explanation') !== 'false',
    question_ids: formData.get('question_ids'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };

  const { question_ids, due_at, ...rest } = parsed.data;
  const ids = question_ids.split(',').map((s) => s.trim()).filter(Boolean);

  try {
    await createAssignment(profile.id, {
      ...rest,
      due_at: due_at || null,
      question_ids: ids,
    });
    revalidatePath('/teacher/assignments');
    return { success: 'Đã tạo bài giao!' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi hệ thống' };
  }
}
