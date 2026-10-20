import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentProfile } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';

const bodySchema = z.object({
  roomId: z.string().uuid(),
  aiEnabled: z.boolean().optional(),
  dailyLimit: z.number().int().min(0).max(100).optional(),
});

export async function PATCH(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Không có quyền.' }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
  }

  const sb = createAdminClient();

  // Verify teacher owns room
  const { data: room } = await sb
    .from('rooms')
    .select('id')
    .eq('id', body.roomId)
    .eq('owner_id', profile.id)
    .single();

  if (!room) {
    return NextResponse.json({ error: 'Phòng không tồn tại hoặc không có quyền.' }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (body.aiEnabled !== undefined) updates.ai_enabled = body.aiEnabled;
  if (body.dailyLimit !== undefined) updates.daily_limit_per_student = body.dailyLimit;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Không có gì để cập nhật.' }, { status: 400 });
  }

  const { error } = await sb
    .from('ai_room_settings')
    .upsert({ room_id: body.roomId, ...updates }, { onConflict: 'room_id' });

  if (error) {
    return NextResponse.json({ error: 'Lỗi cập nhật.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
