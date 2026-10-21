'use client';

import { useEffect, useState } from 'react';
import type { BuildingId } from '@/types/game';
import type { BuildingNotification } from '@/game/config/town-map';

export function useBuildingNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Record<BuildingId, BuildingNotification[]>>(
    {} as Record<BuildingId, BuildingNotification[]>
  );

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function check() {
      const result: Record<string, BuildingNotification[]> = {};

      try {
        // Fetch real assignments count via API
        const res = await fetch('/api/student-assignments');
        if (res.ok) {
          const data = await res.json();
          const pending = (data.assignments ?? []).length;
          if (pending > 0) {
            result.school = [{ type: 'assignment', label: `${pending} bài giao` }];
          }
        }

        // Fetch unread notifications count
        const nRes = await fetch('/api/notifications');
        if (nRes.ok) {
          const nData = await nRes.json();
          const unread = nData.unread_count ?? 0;
          if (unread > 0 && !result.school) {
            result.school = [{ type: 'notification', label: `${unread} thông báo mới` }];
          }
        }
      } catch { /* ignore */ }

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
