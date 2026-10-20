'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { BuildingId } from '@/types/game';
import type { BuildingNotification } from '@/game/config/town-map';

export function useBuildingNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Record<BuildingId, BuildingNotification[]>>(
    {} as Record<BuildingId, BuildingNotification[]>
  );

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const supabase = createClient();

    async function check() {
      const result: Record<string, BuildingNotification[]> = {};

      // Bài giao chưa nộp → dấu "!" trên School
      const { count: pendingAssignments } = await supabase
        .from('assignments')
        .select('id', { count: 'exact', head: true })
        .not('id', 'in', `(select assignment_id from submissions where student_id = '${userId}' and status != 'draft')`)
        .gte('due_at', new Date().toISOString());

      if (pendingAssignments && pendingAssignments > 0) {
        result.school = [{ type: 'assignment', label: `${pendingAssignments} bài chưa làm` }];
      }

      // Câu sai cần ôn → dấu "!" trên Review Station
      const { count: pendingReview } = await supabase
        .from('review_queue')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', userId)
        .eq('status', 'pending');

      if (pendingReview && pendingReview > 0) {
        result.review_station = [{ type: 'review', label: `${pendingReview} câu cần ôn` }];
      }

      if (!cancelled) {
        setNotifications(result as Record<BuildingId, BuildingNotification[]>);
      }
    }

    check();
    const interval = setInterval(check, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [userId]);

  return notifications;
}
