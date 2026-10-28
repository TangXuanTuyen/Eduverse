import 'server-only';

import { getAIProvider } from '@/lib/ai/provider';
import { filterOutput } from '@/lib/ai/safety';
import {
  buildCommentEvidence,
  buildCommentPrompt,
  COMMENT_SYSTEM_PROMPT,
  parseCommentDraft,
  type StudentCommentDraft,
} from '@/lib/reports/student-comment';
import { getStudentDetailReport } from '@/services/reports';

export type StudentCommentResult =
  | ({ status: 'ok' } & StudentCommentDraft)
  | { status: 'insufficient'; message: string }
  | { status: 'error'; message: string }
  | null;

const INSUFFICIENT_TEXT =
  'Hiện tại chưa có đủ dữ liệu bài làm để nhận xét chính xác về mức độ hiểu bài của học sinh. Hãy hoàn thành các hoạt động được giao để có thêm căn cứ nhận xét.';

export async function generateStudentComment(
  teacherId: string,
  studentId: string,
): Promise<StudentCommentResult> {
  const report = await getStudentDetailReport(teacherId, studentId);
  if (!report) return null;

  const evidence = buildCommentEvidence(report);
  if (!evidence.sufficient) return { status: 'insufficient', message: INSUFFICIENT_TEXT };

  try {
    const response = await getAIProvider().generateText(buildCommentPrompt(evidence), {
      systemPrompt: COMMENT_SYSTEM_PROMPT,
      maxTokens: 900,
      temperature: 0.4,
      timeoutMs: 25000,
    });
    const draft = parseCommentDraft(filterOutput(response.text));
    if (draft) return { status: 'ok', ...draft };
  } catch {
    // Trả về lỗi có thể thử lại; không làm hỏng màn hình chi tiết học sinh
  }

  return {
    status: 'error',
    message: 'Chưa tạo được nhận xét. Hãy thử lại sau ít phút.',
  };
}
