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
  seenAt: number;
}

/** Một người vắng tín hiệu vị trí quá lâu mà không còn trong danh sách trực tuyến mới bị ẩn. */
const STALE_WITHOUT_ROSTER_MS = 12_000;
/** Cập nhật hồ sơ vị trí vào danh sách trực tuyến (Presence) định kỳ. */
const TRACK_INTERVAL_MS = 5_000;

export function usePresence(roomId: string | null, userId: string | null, hideOnline: boolean) {
  const [peers, setPeers] = useState<InterpolatedPeer[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const peersMap = useRef<Map<string, InterpolatedPeer>>(new Map());
  const onlineRef = useRef<Set<string>>(new Set());
  const subscribedRef = useRef(false);
  const lastStateRef = useRef<PeerState | null>(null);
  const lastTrackRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (!roomId || !userId || hideOnline) {
      setPeers([]);
      return;
    }

    const supabase = createClient();
    // Danh sách trực tuyến (Presence) gắn với kết nối, không phụ thuộc bộ đếm giờ của tab nên
    // nhân vật không biến mất khi tab bị trình duyệt làm chậm; vị trí mượt lấy từ broadcast.
    const channel = supabase.channel(`room:${roomId}`, {
      config: { broadcast: { self: false }, presence: { key: userId } },
    });

    const upsert = (p: PeerState, keepSeen = false) => {
      if (p.userId === userId) return;
      const existing = peersMap.current.get(p.userId);
      // Bỏ tin cũ hơn tin đã nhận (tránh nhân vật giật lùi)
      if (existing && p.timestamp < existing.timestamp) return;
      peersMap.current.set(p.userId, {
        ...p,
        targetX: p.x,
        targetY: p.y,
        x: existing?.x ?? p.x,
        y: existing?.y ?? p.y,
        seenAt: keepSeen && existing ? existing.seenAt : Date.now(),
      });
    };

    channel
      .on('broadcast', { event: 'presence' }, ({ payload }) => {
        upsert(payload as PeerState);
      })
      .on('broadcast', { event: 'leave' }, ({ payload }) => {
        const id = (payload as { userId: string }).userId;
        onlineRef.current.delete(id);
        peersMap.current.delete(id);
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as Record<string, PeerState[]>;
        const online = new Set<string>();
        for (const [key, metas] of Object.entries(state)) {
          if (key === userId) continue;
          online.add(key);
          const meta = metas[metas.length - 1];
          if (meta && !peersMap.current.has(key)) upsert({ ...meta, userId: key });
        }
        onlineRef.current = online;
        for (const id of [...peersMap.current.keys()]) {
          if (!online.has(id) && Date.now() - (peersMap.current.get(id)?.seenAt ?? 0) > STALE_WITHOUT_ROSTER_MS) {
            peersMap.current.delete(id);
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          subscribedRef.current = true;
          if (lastStateRef.current) {
            lastTrackRef.current = Date.now();
            channel.track(lastStateRef.current).catch(() => {});
          }
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          subscribedRef.current = false;
        }
      });

    channelRef.current = channel;

    // Interpolation tick
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      for (const [id, peer] of peersMap.current) {
        // Còn trong danh sách trực tuyến thì luôn hiển thị; chưa có danh sách thì dựa vào tín hiệu vị trí
        if (!onlineRef.current.has(id) && now - peer.seenAt > STALE_WITHOUT_ROSTER_MS) {
          peersMap.current.delete(id);
          continue;
        }
        // Lerp toward target
        peer.x += (peer.targetX - peer.x) * 0.2;
        peer.y += (peer.targetY - peer.y) * 0.2;
      }
      const sorted = [...peersMap.current.values()]
        .sort((a, b) => (a.userId < b.userId ? -1 : 1)) // thứ tự ổn định, không đảo chỗ khi có tin mới
        .slice(0, MAX_VISIBLE_AVATARS);
      setPeers(sorted);
    }, 50);

    return () => {
      channel.untrack().catch(() => {});
      supabase.removeChannel(channel);
      channelRef.current = null;
      subscribedRef.current = false;
      onlineRef.current = new Set();
      clearInterval(intervalRef.current);
      peersMap.current.clear();
      setPeers([]);
    };
  }, [roomId, userId, hideOnline]);

  const broadcast = useCallback(
    (state: Omit<PeerState, 'timestamp'>) => {
      const payload = { ...state, timestamp: Date.now() };
      lastStateRef.current = payload;
      const channel = channelRef.current;
      if (!channel || !subscribedRef.current) return; // chưa kết nối xong: tin đầu tiên gửi khi SUBSCRIBED
      channel.send({ type: 'broadcast', event: 'presence', payload });
      if (payload.timestamp - lastTrackRef.current > TRACK_INTERVAL_MS) {
        lastTrackRef.current = payload.timestamp;
        channel.track(payload).catch(() => {});
      }
    },
    []
  );

  // Quay lại tab sau khi bị ẩn: báo ngay vị trí để bạn cùng lớp thấy lại
  useEffect(() => {
    const onVisible = () => {
      if (document.hidden) return;
      const ch = channelRef.current;
      const st = lastStateRef.current;
      if (ch && st && subscribedRef.current) {
        const payload = { ...st, timestamp: Date.now() };
        lastStateRef.current = payload;
        ch.send({ type: 'broadcast', event: 'presence', payload });
        lastTrackRef.current = payload.timestamp;
        ch.track(payload).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

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
