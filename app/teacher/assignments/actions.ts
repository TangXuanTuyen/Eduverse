'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentProfile } from '@/lib/auth/session';
import { createAssignment, createTaskAssignment } from '@/services/assignments';
import { getSetQuestionIds } from '@/services/question-sets';

const assignmentSchema = z.object({
  room_id: z.string().uuid('Chọn phòng'),
  set_id: z.string().uuid('Chọn bộ đề'),
  title: z.string().trim().min(1, 'Nhập tiêu đề').max(200),
  description: z.string().max(2000).default(''),
  due_at: z.string().optional(),
  late_policy: z.enum(['hard_lock', 'marked_late']).default('hard_lock'),
  max_retries: z.coerce.number().int().min(0).max(10).default(0),
  show_explanation_after_submit: z.coerce.boolean().default(true),
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
    set_id: formData.get('set_id'),
    title: formData.get('title'),
    description: formData.get('description') || '',
    due_at: formData.get('due_at') || undefined,
    late_policy: formData.get('late_policy') || 'hard_lock',
    max_retries: formData.get('max_retries') || 0,
    show_explanation_after_submit: formData.get('show_explanation') !== 'false',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };

  const { set_id, due_at, ...rest } = parsed.data;

  try {
    const questionIds = await getSetQuestionIds(set_id);
    if (questionIds.length === 0) return { error: 'Bộ đề trống, không có câu hỏi' };

    await createAssignment(profile.id, {
      ...rest,
      due_at: due_at || null,
      question_ids: questionIds,
    });
    revalidatePath('/teacher/assignments');
    return { success: 'Đã giao bài thành công!' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi hệ thống' };
  }
}

const taskSchema = z.object({
  room_id: z.string().uuid('Chọn phòng'),
  title: z.string().trim().min(1, 'Nhập tiêu đề').max(200),
  description: z.string().max(2000).default(''),
  assignment_type: z.enum(['lesson', 'experiment']),
  resource_id: z.string().min(1, 'Chọn bài học hoặc thí nghiệm'),
  resource_title: z.string().min(1),
  due_at: z.string().optional(),
});

export async function createTaskAction(
  _prev: AssignmentActionState,
  formData: FormData
): Promise<AssignmentActionState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') return { error: 'Không có quyền' };

  const parsed = taskSchema.safeParse({
    room_id: formData.get('room_id'),
    title: formData.get('title'),
    description: formData.get('description') || '',
    assignment_type: formData.get('assignment_type'),
    resource_id: formData.get('resource_id'),
    resource_title: formData.get('resource_title'),
    due_at: formData.get('due_at') || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };

  try {
    const { due_at, ...rest } = parsed.data;
    await createTaskAssignment(profile.id, { ...rest, due_at: due_at || null });
    revalidatePath('/teacher/assignments');
    return { success: 'Đã giao nhiệm vụ thành công!' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi hệ thống' };
  }
}
