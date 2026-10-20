import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

export async function getAIStats(roomIds: string[]) {
  if (roomIds.length === 0) return { totalConversations: 0, totalMessages: 0, topModes: [] };

  const sb = createAdminClient();
  const { data: convs } = await sb
    .from('ai_conversations')
    .select('id, mode')
    .in('room_id', roomIds);

  const conversations = convs ?? [];
  const modeCounts: Record<string, number> = {};
  for (const c of conversations) {
    modeCounts[c.mode] = (modeCounts[c.mode] ?? 0) + 1;
  }
  const topModes = Object.entries(modeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([mode, count]) => ({ mode, count }));

  const { count } = await sb
    .from('ai_messages')
    .select('id', { count: 'exact', head: true })
    .in('conversation_id', conversations.map((c: { id: string }) => c.id));

  return {
    totalConversations: conversations.length,
    totalMessages: count ?? 0,
    topModes,
  };
}

export async function getSafetyAlerts(roomIds: string[]) {
  if (roomIds.length === 0) return [];

  const sb = createAdminClient();
  const { data: convIds } = await sb
    .from('ai_conversations')
    .select('id')
    .in('room_id', roomIds);

  if (!convIds?.length) return [];

  const { data } = await sb
    .from('ai_messages')
    .select('id, conversation_id, content, flag_reason, created_at')
    .in('conversation_id', convIds.map((c: { id: string }) => c.id))
    .eq('flagged', true)
    .order('created_at', { ascending: false })
    .limit(50);

  return data ?? [];
}

export async function getConversationForReview(
  conversationId: string,
  teacherId: string,
  teacherRoomIds: string[]
) {
  const sb = createAdminClient();

  const { data: conv } = await sb
    .from('ai_conversations')
    .select('id, student_id, mode, room_id, created_at')
    .eq('id', conversationId)
    .single();

  if (!conv || !conv.room_id || !teacherRoomIds.includes(conv.room_id)) {
    return null;
  }

  const { data: messages } = await sb
    .from('ai_messages')
    .select('id, role, content, flagged, flag_reason, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  await sb.from('audit_logs').insert({
    actor_id: teacherId,
    action: 'review_ai_conversation',
    target_type: 'ai_conversation',
    target_id: conversationId,
    detail: {},
  });

  return { conversation: conv, messages: messages ?? [] };
}
