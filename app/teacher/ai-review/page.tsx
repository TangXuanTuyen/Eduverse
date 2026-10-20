import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAIStats, getSafetyAlerts } from '@/services/ai-review';
import { AIReviewClient } from './client';

export default async function AIReviewPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') redirect('/login');

  const sb = createAdminClient();
  const { data: rooms } = await sb
    .from('rooms')
    .select('id, name')
    .eq('owner_id', profile.id);

  const roomIds = (rooms ?? []).map((r: { id: string }) => r.id);

  const [stats, alerts] = await Promise.all([
    getAIStats(roomIds),
    getSafetyAlerts(roomIds),
  ]);

  return (
    <AIReviewClient
      rooms={rooms ?? []}
      stats={stats}
      alerts={alerts}
    />
  );
}
