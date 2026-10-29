'use server';

import { z } from 'zod';
import { getCurrentProfile } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';

const nameSchema = z.object({
  name: z.string().trim().min(2, 'Tên cần ít nhất 2 ký tự').max(40, 'Tên tối đa 40 ký tự'),
});

export type UpdateNameState = { error?: string; success?: boolean };

export async function updateDisplayNameAction(name: string): Promise<UpdateNameState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: 'Bạn cần đăng nhập lại' };

  const parsed = nameSchema.safeParse({ name });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Tên không hợp lệ' };

  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ display_name: parsed.data.name })
    .eq('id', profile.id);
  if (error) return { error: 'Không lưu được tên, hãy thử lại' };

  return { success: true };
}
