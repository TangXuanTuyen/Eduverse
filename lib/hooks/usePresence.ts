'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { MAX_VISIBLE_AVATARS, PRESENCE_BROADCAST_INTERVAL_MS } from '@/game/config/town-map';

export interface PeerState {
  userId: string;
  displayName: string;
  x: number;
  y: number;
  facing: string;
  outfit: string;
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  timestamp: number;
}

interface InterpolatedPeer extends PeerState {
  targetX: number;
  targetY: number;
}

export function usePresence(roomId: string | null, userId: string | null, hideOnline: boolean) {
  const [peers, setPeers] = useState<InterpolatedPeer[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const peersMap = useRef<Map<string, InterpolatedPeer>>(new Map());
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (!roomId || !userId || hideOnline) {
      setPeers([]);
      return;
    }

    const supabase = createClient();
    const channel = supabase.channel(`room:${roomId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'presence' }, ({ payload }) => {
        const p = payload as PeerState;
        if (p.userId === userId) return;
        const existing = peersMap.current.get(p.userId);
        peersMap.current.set(p.userId, {
          ...p,
          targetX: p.x,
          targetY: p.y,
          x: existing?.x ?? p.x,
          y: existing?.y ?? p.y,
        });
      })
      .on('broadcast', { event: 'leave' }, ({ payload }) => {
        peersMap.current.delete((payload as { userId: string }).userId);
      })
      .subscribe();

    channelRef.current = channel;

    // Interpolation tick
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const staleThreshold = 10_000;
      for (const [id, peer] of peersMap.current) {
        if (now - peer.timestamp > staleThreshold) {
          peersMap.current.delete(id);
          continue;
        }
        // Lerp toward target
        peer.x += (peer.targetX - peer.x) * 0.2;
        peer.y += (peer.targetY - peer.y) * 0.2;
      }
      const sorted = [...peersMap.current.values()]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, MAX_VISIBLE_AVATARS);
      setPeers(sorted);
    }, 50);

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      clearInterval(intervalRef.current);
      peersMap.current.clear();
      setPeers([]);
    };
  }, [roomId, userId, hideOnline]);

  const broadcast = useCallback(
    (state: Omit<PeerState, 'timestamp'>) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'presence',
        payload: { ...state, timestamp: Date.now() },
      });
    },
    []
  );

  const broadcastLeave = useCallback(() => {
    if (channelRef.current && userId) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'leave',
        payload: { userId },
      });
    }
  }, [userId]);

  return { peers, broadcast, broadcastLeave };
}
