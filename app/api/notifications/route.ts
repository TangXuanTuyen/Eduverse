import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('notifications')
    .select('id, type, title, body, is_read, created_at, room_id')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { count } = await admin
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', profile.id)
    .eq('is_read', false);

  return NextResponse.json({ notifications: data, unread_count: count ?? 0 });
}

export async function PATCH(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const admin = createAdminClient();

  if (body.mark_all_read) {
    await admin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', profile.id)
      .eq('is_read', false);
  } else if (body.notification_id) {
    await admin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', body.notification_id)
      .eq('user_id', profile.id);
  }

  return NextResponse.json({ ok: true });
}
