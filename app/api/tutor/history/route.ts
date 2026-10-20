import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'student') {
    return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const conversationId = searchParams.get('conversationId');
  const sb = createAdminClient();

  if (conversationId) {
    // Verify ownership then return messages
    const { data: conv } = await sb
      .from('ai_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('student_id', profile.id)
      .single();

    if (!conv) {
      return NextResponse.json({ error: 'Không tìm thấy.' }, { status: 404 });
    }

    const { data: messages } = await sb
      .from('ai_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(50);

    return NextResponse.json({ messages: messages ?? [] });
  }

  // List conversations
  const { data: conversations } = await sb
    .from('ai_conversations')
    .select('id, mode, source, message_count, created_at, updated_at')
    .eq('student_id', profile.id)
    .order('updated_at', { ascending: false })
    .limit(20);

  return NextResponse.json({ conversations: conversations ?? [] });
}
