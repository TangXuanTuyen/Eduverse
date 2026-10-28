import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { getAIProvider } from '@/lib/ai/provider';
import { getSystemPrompt } from '@/lib/ai/system-prompts';
import { buildPedagogyDirective, classifyIntent, supportLevelFromHistory } from '@/lib/ai/pedagogy';
import {
  filterInput,
  detectCrisis,
  filterOutput,
  sanitizeForAI,
  CRISIS_RESPONSE,
  type SafetyResult,
  type CrisisResult,
} from '@/lib/ai/safety';
import type { AIMessage } from '@/lib/ai/provider';

export type TutorMode = 'lesson' | 'assignment' | 'review' | 'companion';

export type TutorRequest = {
  studentId: string;
  message: string;
  mode: TutorMode;
  conversationId?: string;
  contextType?: string;
  contextId?: string;
  roomId?: string;
  source?: 'page' | 'companion';
};

export type TutorResponse = {
  reply: string;
  conversationId: string;
  remainingQuota: number;
  flagged?: boolean;
};

const DEFAULT_DAILY_LIMIT = 30;

export async function handleTutorMessage(req: TutorRequest): Promise<TutorResponse> {
  const sb = createAdminClient();

  // 1. Safety: input filter
  const inputCheck: SafetyResult = filterInput(req.message);
  if (!inputCheck.safe) {
    throw new TutorError(
      inputCheck.reason === 'too_long'
        ? 'Tin nhắn quá dài (tối đa 500 ký tự).'
        : inputCheck.reason === 'empty_input'
          ? 'Vui lòng nhập nội dung.'
          : 'Tin nhắn không hợp lệ.',
      'INVALID_INPUT'
    );
  }

  // 2. Crisis detection
  const crisisCheck: CrisisResult = detectCrisis(req.message);
  if (crisisCheck.detected) {
    const convId = req.conversationId ?? (await createConversation(sb, req));
    await saveMessage(sb, convId, 'user', req.message, 0, true, `crisis:${crisisCheck.keyword}`);
    await saveMessage(sb, convId, 'assistant', CRISIS_RESPONSE, 0, true, 'crisis_response');
    await logCrisis(sb, req.studentId, convId, crisisCheck.keyword);
    return {
      reply: CRISIS_RESPONSE,
      conversationId: convId,
      remainingQuota: await getRemainingQuota(sb, req.studentId, req.roomId),
      flagged: true,
    };
  }

  // 3. Room AI check + rate limit
  const dailyLimit = await getDailyLimit(sb, req.roomId);
  if (dailyLimit === 0) {
    throw new TutorError('AI chưa được bật cho phòng học này.', 'AI_DISABLED');
  }

  const { data: allowed } = await sb.rpc('increment_ai_usage', {
    p_student_id: req.studentId,
    p_daily_limit: dailyLimit,
  });
  if (!allowed) {
    throw new TutorError(
      `Hôm nay em đã dùng hết ${dailyLimit} lượt hỏi AI. Quay lại ngày mai nhé!`,
      'RATE_LIMITED'
    );
  }

  // 4. Get or create conversation
  const conversationId = req.conversationId ?? (await createConversation(sb, req));

  // 5. Load history
  const history: { role: string; content: string }[] = await getHistory(sb, conversationId);

  // 6. Build context
  const context = req.contextId ? await loadContext(sb, req.contextType, req.contextId) : undefined;
  const systemPrompt = buildTutorSystemPrompt(req, history, context);

  // 7. Call AI
  const provider = getAIProvider();
  const aiHistory: AIMessage[] = history.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const thinkingBudget = req.mode === 'companion' ? 256 : 512;

  const response = await provider.generateText(sanitizeForAI(req.message), {
    systemPrompt,
    history: aiHistory,
    maxTokens: 512,
    temperature: 0.7,
    thinkingBudget,
  });

  const filteredReply = filterOutput(response.text);

  // 8. Save messages
  await saveMessage(sb, conversationId, 'user', req.message, 0);
  await saveMessage(sb, conversationId, 'assistant', filteredReply, response.tokensUsed);

  // 9. Update message count
  await sb
    .from('ai_conversations')
    .update({ message_count: history.length + 2 })
    .eq('id', conversationId);

  const remaining = await getRemainingQuota(sb, req.studentId, req.roomId);

  return { reply: filteredReply, conversationId, remainingQuota: remaining };
}

export type TutorStreamResult = {
  stream: AsyncGenerator<string>;
  conversationId: string;
  remainingQuota: number;
};

function buildTutorSystemPrompt(
  req: TutorRequest,
  history: { role: string; content: string }[],
  context: string | undefined,
): string {
  const base = getSystemPrompt(req.mode, context);
  const lastAssistant = [...history].reverse().find((m) => m.role === 'assistant');
  const askedQuestion = lastAssistant ? lastAssistant.content.trim().endsWith('?') : false;
  const intent = classifyIntent(req.message, askedQuestion);
  const level = supportLevelFromHistory(history);
  return base + buildPedagogyDirective(intent, level);
}

export async function handleTutorStream(req: TutorRequest): Promise<TutorStreamResult> {
  const sb = createAdminClient();

  const inputCheck: SafetyResult = filterInput(req.message);
  if (!inputCheck.safe) {
    throw new TutorError(
      inputCheck.reason === 'too_long'
        ? 'Tin nhắn quá dài (tối đa 500 ký tự).'
        : inputCheck.reason === 'empty_input'
          ? 'Vui lòng nhập nội dung.'
          : 'Tin nhắn không hợp lệ.',
      'INVALID_INPUT'
    );
  }

  const crisisCheck: CrisisResult = detectCrisis(req.message);
  if (crisisCheck.detected) {
    const convId = req.conversationId ?? (await createConversation(sb, req));
    await saveMessage(sb, convId, 'user', req.message, 0, true, `crisis:${crisisCheck.keyword}`);
    await saveMessage(sb, convId, 'assistant', CRISIS_RESPONSE, 0, true, 'crisis_response');
    await logCrisis(sb, req.studentId, convId, crisisCheck.keyword);
    const remaining = await getRemainingQuota(sb, req.studentId, req.roomId);
    async function* crisisStream() {
      yield CRISIS_RESPONSE;
      return { text: CRISIS_RESPONSE, tokensUsed: 0 };
    }
    return { stream: crisisStream(), conversationId: convId, remainingQuota: remaining };
  }

  const dailyLimit = await getDailyLimit(sb, req.roomId);
  if (dailyLimit === 0) {
    throw new TutorError('AI chưa được bật cho phòng học này.', 'AI_DISABLED');
  }

  const [{ data: allowed }, conversationId] = await Promise.all([
    sb.rpc('increment_ai_usage', { p_student_id: req.studentId, p_daily_limit: dailyLimit }),
    req.conversationId ? Promise.resolve(req.conversationId) : createConversation(sb, req),
  ]);
  if (!allowed) {
    throw new TutorError(
      `Hôm nay em đã dùng hết ${dailyLimit} lượt hỏi AI. Quay lại ngày mai nhé!`,
      'RATE_LIMITED'
    );
  }

  const [history, context] = await Promise.all([
    getHistory(sb, conversationId),
    req.contextId ? loadContext(sb, req.contextType, req.contextId) : Promise.resolve(undefined),
  ]);
  const systemPrompt = buildTutorSystemPrompt(req, history, context);

  const provider = getAIProvider();
  const aiHistory: AIMessage[] = history.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const thinkingBudget = req.mode === 'companion' ? 256 : 512;

  const innerStream = provider.generateStream(sanitizeForAI(req.message), {
    systemPrompt,
    history: aiHistory,
    maxTokens: 512,
    temperature: 0.7,
    thinkingBudget,
  });

  await saveMessage(sb, conversationId, 'user', req.message, 0);

  async function* wrappedStream() {
    const result: { text: string; tokensUsed: number } = yield* innerStream;
    const filteredReply = filterOutput(result.text);
    await saveMessage(sb, conversationId, 'assistant', filteredReply, result.tokensUsed);
    await sb
      .from('ai_conversations')
      .update({ message_count: history.length + 2 })
      .eq('id', conversationId);
    return result;
  }

  const remaining = await getRemainingQuota(sb, req.studentId, req.roomId);
  return { stream: wrappedStream(), conversationId, remainingQuota: remaining };
}

// --- helpers ---

async function createConversation(
  sb: ReturnType<typeof createAdminClient>,
  req: TutorRequest
): Promise<string> {
  const { data, error } = await sb
    .from('ai_conversations')
    .insert({
      student_id: req.studentId,
      mode: req.mode,
      source: req.source ?? 'page',
      context_type: req.contextType ?? null,
      context_id: req.contextId ?? null,
      room_id: req.roomId ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function saveMessage(
  sb: ReturnType<typeof createAdminClient>,
  conversationId: string,
  role: string,
  content: string,
  tokensUsed: number,
  flagged = false,
  flagReason?: string
) {
  await sb.from('ai_messages').insert({
    conversation_id: conversationId,
    role,
    content,
    tokens_used: tokensUsed,
    flagged,
    flag_reason: flagReason ?? null,
  });
}

async function getHistory(
  sb: ReturnType<typeof createAdminClient>,
  conversationId: string
) {
  const { data } = await sb
    .from('ai_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(12);
  return (data ?? []).reverse();
}

async function getDailyLimit(
  sb: ReturnType<typeof createAdminClient>,
  roomId?: string
): Promise<number> {
  if (!roomId) return DEFAULT_DAILY_LIMIT;
  const { data } = await sb
    .from('ai_room_settings')
    .select('ai_enabled, daily_limit_per_student')
    .eq('room_id', roomId)
    .single();
  if (!data) return DEFAULT_DAILY_LIMIT;
  if (!data.ai_enabled) return 0;
  return data.daily_limit_per_student;
}

async function getRemainingQuota(
  sb: ReturnType<typeof createAdminClient>,
  studentId: string,
  roomId?: string
): Promise<number> {
  const limit = await getDailyLimit(sb, roomId);
  const { data } = await sb
    .from('ai_usage_limits')
    .select('request_count')
    .eq('student_id', studentId)
    .eq('usage_date', new Date().toISOString().slice(0, 10))
    .single();
  const used = data?.request_count ?? 0;
  return Math.max(0, limit - used);
}

async function loadContext(
  sb: ReturnType<typeof createAdminClient>,
  contextType?: string,
  contextId?: string
): Promise<string | undefined> {
  if (!contextType || !contextId) return undefined;

  if (contextType === 'lesson') {
    const { data } = await sb
      .from('lessons')
      .select('title, content')
      .eq('id', contextId)
      .single();
    if (!data) return undefined;
    return sanitizeForAI(`Bài: ${data.title}\n${data.content ?? ''}`);
  }

  if (contextType === 'assignment') {
    const { data } = await sb
      .from('assignments')
      .select('title, description')
      .eq('id', contextId)
      .single();
    if (!data) return undefined;
    return sanitizeForAI(`Bài tập: ${data.title}\n${data.description ?? ''}`);
  }

  return undefined;
}

async function logCrisis(
  sb: ReturnType<typeof createAdminClient>,
  studentId: string,
  conversationId: string,
  keyword: string
) {
  await sb.from('audit_logs').insert({
    actor_id: studentId,
    action: 'crisis_detected',
    target_type: 'ai_conversation',
    target_id: conversationId,
    detail: { keyword },
  });
}

export class TutorError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'TutorError';
    this.code = code;
  }
}
