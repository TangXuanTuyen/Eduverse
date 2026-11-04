import 'server-only';

import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAIProvider } from '@/lib/ai/provider';
import { CRISIS_RESPONSE, detectCrisis, filterInput, filterOutput, sanitizeForAI } from '@/lib/ai/safety';

// Dùng chung bộ lượt hỏi AI hằng ngày với Vina
const DAILY_LIMIT = 30;

const shortText = z.string().max(60);
const num = z.number().finite().min(-1000).max(1000);

export const explainBodySchema = z.object({
  question: z.string().min(1).max(300),
  cellData: z.object({
    electrode1: shortText.optional(),
    electrode2: shortText.optional(),
    solution: shortText.optional(),
    concentrationM: num.optional(),
    validation: z.object({ isValid: z.boolean().optional(), message: z.string().max(200).optional() }).optional(),
    anode: z.object({ material: shortText, sign: shortText.optional(), reaction: z.string().max(200) }).nullable().optional(),
    cathode: z.object({ material: shortText, sign: shortText.optional(), reaction: z.string().max(200) }).nullable().optional(),
    electrical: z.object({
      standardCellPotential: num.optional(),
      openCircuitVoltage: num.optional(),
      loadVoltage: num.optional(),
      circuitCurrent: num.optional(),
      internalResistance: num.optional(),
    }).optional(),
  }).optional(),
});

export type ExplainBody = z.infer<typeof explainBodySchema>;

export class StemExplainError extends Error {
  constructor(message: string, public code: 'INVALID_INPUT' | 'RATE_LIMITED' | 'AI_UNAVAILABLE') {
    super(message);
  }
}

const SYSTEM_PROMPT = `Bạn là Giáo viên STEM môn Khoa học Tự nhiên (Vật lí - Hóa học) cho học sinh THCS trong nền tảng Vina EDUVERSE.
Nhiệm vụ: giải thích hiện tượng và cơ chế của pin điện hóa Volta cho học sinh một cách dễ hiểu, chuẩn mực sư phạm.

NGUYÊN TẮC BẮT BUỘC:
1. Không bịa đặt, không đưa số liệu điện áp hoặc dòng điện khác với dữ liệu đo đã cung cấp.
2. Phân biệt rõ: anode là cực âm (nơi xảy ra oxi hóa, kim loại tan ra nhường electron); cathode là cực dương (nơi ion nhận electron).
3. Trong dung dịch H2SO4, bọt khí tại Cu là khí hydro do ion H+ nhận electron, không phải do thanh Cu tan.
4. Không làm bài hộ; gợi ý để học sinh tự suy luận khi phù hợp.
5. Trả lời súc tích trong 2-3 đoạn ngắn, thân thiện.`;

function buildContext(cellData: ExplainBody['cellData']): string {
  const c = cellData ?? {};
  const e = c.electrical ?? {};
  return [
    'DỮ LIỆU ĐO ĐÃ ĐƯỢC BỘ XỬ LÝ KHOA HỌC XÁC THỰC:',
    `- Điện cực: ${c.electrode1 ?? 'Zn'} và ${c.electrode2 ?? 'Cu'}`,
    `- Dung dịch: ${c.solution ?? 'H2SO4'} (${c.concentrationM ?? 0.5} M)`,
    `- Trạng thái: ${c.validation?.isValid ? 'Hợp lệ' : 'Chưa hợp lệ'} ${c.validation?.message ?? ''}`,
    `- Anode: ${c.anode ? `${c.anode.material} (${c.anode.reaction})` : 'Chưa xác định'}`,
    `- Cathode: ${c.cathode ? `${c.cathode.material} (${c.cathode.reaction})` : 'Chưa xác định'}`,
    `- E°cell: ${e.standardCellPotential ?? 0} V; Voc: ${e.openCircuitVoltage ?? 0} V; Vload: ${e.loadVoltage ?? 0} V`,
    `- Dòng điện: ${((e.circuitCurrent ?? 0) * 1000).toFixed(1)} mA; nội trở r: ${e.internalResistance ?? 0} Ω`,
  ].join('\n');
}

/** Giải thích pin Volta cho người dùng đã đăng nhập (HS hoặc GV). Không gửi họ tên, lớp hay trường cho AI. */
export async function explainVoltaCell(userId: string, body: ExplainBody): Promise<string> {
  const admin = createAdminClient();

  const inputCheck = filterInput(body.question);
  if (!inputCheck.safe) {
    throw new StemExplainError('Câu hỏi không hợp lệ hoặc quá dài (tối đa 300 ký tự).', 'INVALID_INPUT');
  }

  if (detectCrisis(body.question).detected) return CRISIS_RESPONSE;

  const { data: allowed } = await admin.rpc('increment_ai_usage', {
    p_student_id: userId,
    p_daily_limit: DAILY_LIMIT,
  });
  if (allowed === false) {
    throw new StemExplainError('Hôm nay đã dùng hết lượt hỏi AI. Quay lại ngày mai nhé!', 'RATE_LIMITED');
  }

  const provider = getAIProvider();
  try {
    const result = await provider.generateText(
      sanitizeForAI(`${buildContext(body.cellData)}\n\nCÂU HỎI CỦA HỌC SINH:\n"${body.question}"`),
      {
        systemPrompt: SYSTEM_PROMPT,
        maxTokens: 600,
        temperature: 0.4,
        thinkingBudget: 256,
        timeoutMs: 25000,
      },
    );
    return filterOutput(result.text);
  } catch {
    throw new StemExplainError('Trợ lý AI đang bận, em thử lại sau nhé.', 'AI_UNAVAILABLE');
  }
}
