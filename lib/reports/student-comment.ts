export type CommentSubmission = { status: string; total_score: number | null; max_score: number | null };
export type CommentQuestion = {
  question_content: string;
  is_correct: boolean | null;
  assignment_title: string;
};
export type CommentSkill = { skill: string; correct: number; total: number; accuracy: number };

export type CommentEvidence = {
  submittedCount: number;
  pendingCount: number;
  answeredCount: number;
  correctCount: number;
  incorrectCount: number;
  averagePercent: number | null;
  skills: CommentSkill[];
  questions: CommentQuestion[];
  sufficient: boolean;
};

export const MIN_ANSWERS_FOR_COMMENT = 3;

export function buildCommentEvidence(input: {
  submissions: CommentSubmission[];
  question_details: CommentQuestion[];
  skill_breakdown: CommentSkill[];
}): CommentEvidence {
  const answered = input.question_details.filter((q) => q.is_correct !== null);
  const correctCount = answered.filter((q) => q.is_correct === true).length;
  const incorrectCount = answered.length - correctCount;
  const scored = input.submissions.filter(
    (s) => s.total_score !== null && s.max_score !== null && Number(s.max_score) > 0,
  );
  const submitted = input.submissions.filter((s) => s.status !== 'draft');
  const averagePercent = scored.length
    ? Math.round(scored.reduce((sum, s) => sum + (Number(s.total_score) / Number(s.max_score)) * 100, 0) / scored.length)
    : null;

  return {
    submittedCount: submitted.length,
    pendingCount: input.submissions.length - submitted.length,
    answeredCount: answered.length,
    correctCount,
    incorrectCount,
    averagePercent,
    skills: input.skill_breakdown.filter((s) => s.total > 0),
    questions: answered.map((q) => ({ ...q, question_content: q.question_content.slice(0, 160) })),
    sufficient: answered.length >= MIN_ANSWERS_FOR_COMMENT,
  };
}

const BANNED_FRAGMENTS = [
  '{', '}', '"summary"', '"strengths"', '"improvements"', '"next_steps"', '"evidence"',
  'summary', 'strengths', 'improvements', 'next_steps', 'undefined', 'null',
];

export type StudentCommentDraft = {
  summary: string;
  strengths: string[];
  improvements: string[];
  next_steps: string[];
  evidence: string[];
};

function clean(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text) return null;
  if (BANNED_FRAGMENTS.some((f) => text.toLowerCase().includes(f.toLowerCase()))) return null;
  return text.slice(0, max);
}

function cleanList(value: unknown, max: number, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of value) {
    const text = clean(item, max);
    if (text && !seen.has(text)) {
      seen.add(text);
      out.push(text);
    }
    if (out.length >= limit) break;
  }
  return out;
}

function hasRepeatedSentence(summary: string): boolean {
  const sentences = summary.split(/[.!?]+/).map((s) => s.trim().toLowerCase()).filter((s) => s.length > 10);
  return new Set(sentences).size !== sentences.length;
}

export function parseCommentDraft(text: string): StudentCommentDraft | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(match[0]);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;

  const summary = clean(o.summary, 900);
  if (!summary || summary.length < 40) return null;
  if (hasRepeatedSentence(summary)) return null;

  return {
    summary,
    strengths: cleanList(o.strengths, 300, 2),
    improvements: cleanList(o.improvements, 300, 3),
    next_steps: cleanList(o.next_steps, 300, 2),
    evidence: cleanList(o.evidence, 300, 6),
  };
}

export function buildCommentPrompt(evidence: CommentEvidence): string {
  const payload = {
    so_bai_da_nop: evidence.submittedCount,
    so_bai_chua_nop: evidence.pendingCount,
    so_cau_da_tra_loi: evidence.answeredCount,
    so_cau_dung: evidence.correctCount,
    so_cau_sai: evidence.incorrectCount,
    diem_trung_binh_phan_tram: evidence.averagePercent,
    ky_nang: evidence.skills.map((s) => ({ ten: s.skill, dung: s.correct, tong: s.total })),
    cau_hoi: evidence.questions.map((q) => ({
      noi_dung: q.question_content,
      bai: q.assignment_title,
      dung: q.is_correct === true,
    })),
  };
  return `Dữ liệu học tập đã xác thực của một học sinh THCS (không có tên, lớp hay trường):
${JSON.stringify(payload, null, 2)}

Viết nhận xét của giáo viên về học sinh này và trả về đúng một JSON object:
{"summary": string, "strengths": [string], "improvements": [string], "next_steps": [string], "evidence": [string]}`;
}

export const COMMENT_SYSTEM_PROMPT = `Bạn là giáo viên Khoa học tự nhiên đang viết nhận xét cho học sinh THCS lớp 6-9 bằng tiếng Việt.
Yêu cầu:
- "summary" là một đoạn văn tự nhiên 3-5 câu, liền mạch, như lời thầy/cô nhận xét. Không liệt kê rời rạc, không lặp lại câu.
- Trình tự: kết quả nổi bật, điểm mạnh có bằng chứng, chuyển ý nhẹ sang nội dung cần củng cố, hướng cải thiện cụ thể vừa sức, lời động viên gắn với tình hình thực tế. Không bắt buộc đủ năm ý nếu dữ liệu không hỗ trợ.
- Chỉ khẳng định điều dữ liệu chứng minh. Không suy rộng từ bài nhỏ thành kết luận đã thành thạo cả chủ đề.
- Nếu dữ liệu quá ít, viết thận trọng và nói rõ cần thêm bài làm để nhận xét chính xác hơn.
- Không nhắc tên trường JSON, không nêu số liệu thô kiểu danh sách; "evidence" chỉ ghi căn cứ ngắn để giáo viên kiểm tra.
- "next_steps" là hoạt động cụ thể, vừa sức (ví dụ tự vẽ mạch điện rồi giải thích), không dùng lời chung chung như "cố gắng hơn".
- Chỉ trả về JSON.`;
