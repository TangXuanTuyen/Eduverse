'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface SessionState {
  state: 'waiting' | 'active' | 'finished';
  currentStep: number;
  totalDamage: number;
}

export function useRealtimeSession(sessionId: string | null) {
  const [session, setSession] = useState<SessionState | null>(null);
  const [connected, setConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchState = useCallback(async () => {
    if (!sessionId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('room_sessions')
      .select('state, current_step, total_damage')
      .eq('id', sessionId)
      .single();
    if (data) {
      setSession({
        state: data.state,
        currentStep: data.current_step,
        totalDamage: data.total_damage,
      });
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setConnected(false);
      return;
    }

    const supabase = createClient();

    // Fetch initial state (late join / reconnect)
    fetchState();

    const channel = supabase
      .channel(`session:${sessionId}`)
      .on('broadcast', { event: 'state_update' }, ({ payload }) => {
        const p = payload as SessionState;
        setSession(p);
      })
      .on('broadcast', { event: 'damage' }, ({ payload }) => {
        setSession((prev) =>
          prev ? { ...prev, totalDamage: (payload as { totalDamage: number }).totalDamage } : prev
        );
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');

        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          // Reconnect with backoff
          reconnectTimer.current = setTimeout(() => {
            fetchState();
            channel.subscribe();
          }, 2000);
        }
      });

    channelRef.current = channel;

    return () => {
      clearTimeout(reconnectTimer.current);
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [sessionId, fetchState]);

  return { session, connected, refetch: fetchState };
}
