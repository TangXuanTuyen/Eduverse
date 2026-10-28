import 'server-only';

import { getAIProvider } from '@/lib/ai/provider';
import { filterOutput, sanitizeForAI } from '@/lib/ai/safety';
import {
  buildInsightsPrompt,
  buildRuleInsights,
  parseAiInsights,
  type InsightsResult,
} from '@/lib/reports/assignment-insights';
import { getAssignmentDetailReport } from '@/services/reports';

const SYSTEM_PROMPT = `Bạn là trợ lý phân tích kết quả bài kiểm tra KHTN cho giáo viên THCS Việt Nam.
Quy tắc:
- Chỉ dùng dữ liệu được cung cấp. Không bịa số liệu, không bịa kiến thức.
- Nêu vấn đề cụ thể: kiến thức hoặc kỹ năng nào trong câu hỏi bị sai (ví dụ: nhầm cường độ dòng điện giữa mạch nối tiếp và song song). Nếu chỉ có đề bài mà không đủ căn cứ để kết luận nguyên nhân, ghi rõ "cần GV xem bài làm để xác định".
- Mọi nhận định về nguyên nhân là giả thuyết. Dùng "có thể", không khẳng định chắc chắn.
- Không nhắc tới tên, lớp, trường của học sinh. Không chấm điểm hay gắn nhãn cá nhân.
- Viết tiếng Việt, ngắn gọn, đúng chuẩn chương trình lớp 6-9.
- Chỉ trả về JSON, không có văn bản khác.`;

export async function getAssignmentInsights(
  teacherId: string,
  assignmentId: string,
): Promise<(InsightsResult & { assignment_id: string }) | null> {
  const detail = await getAssignmentDetailReport(teacherId, assignmentId);
  if (!detail) return null;

  const rules = buildRuleInsights({
    submittedCount: detail.submittedCount,
    avgScore: detail.avgScore,
    passRate: detail.passRate,
    questions: detail.questions,
  });
  const fallback: InsightsResult = { source: 'rules', ...rules };

  if (detail.submittedCount === 0) return { assignment_id: assignmentId, ...fallback };

  try {
    const prompt = buildInsightsPrompt({
      assignmentType: detail.assignment_type,
      submittedCount: detail.submittedCount,
      avgScore: detail.avgScore,
      passRate: detail.passRate,
      questions: detail.questions.map((q) => ({ ...q, content: sanitizeForAI(q.content) })),
    });
    const response = await getAIProvider().generateText(prompt, {
      systemPrompt: SYSTEM_PROMPT,
      maxTokens: 1500,
      temperature: 0.3,
      timeoutMs: 25000,
    });
    const parsed = parseAiInsights(filterOutput(response.text));
    if (parsed) return { assignment_id: assignmentId, source: 'ai', ...parsed };
  } catch {
    // AI tạm không khả dụng: dùng nhận định theo quy tắc, không làm hỏng trang báo cáo
  }

  return { assignment_id: assignmentId, ...fallback };
}
