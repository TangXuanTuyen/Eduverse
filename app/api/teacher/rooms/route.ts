import { getCurrentProfile } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') {
    return NextResponse.json({ rooms: [] }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from('rooms')
    .select('id, name')
    .eq('owner_id', profile.id)
    .order('name');

  return NextResponse.json({ rooms: data ?? [] });
}
