export type InsightQuestion = {
  sort_order: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  correctRate: number;
};

export type InsightInput = {
  submittedCount: number;
  avgScore: number;
  passRate: number;
  questions: InsightQuestion[];
};

export type AssignmentInsights = {
  summary: string;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
};

export type InsightsResult = {
  source: 'ai' | 'rules';
  overview: string;
  issues: Array<{ question: number; problem: string; action: string }>;
  suggestions: string[];
};

export type PromptQuestion = InsightQuestion & { content: string; type: string };

export type PromptInput = {
  assignmentType: string;
  submittedCount: number;
  avgScore: number;
  passRate: number;
  questions: PromptQuestion[];
};

export function buildRuleInsights(input: InsightInput): Omit<InsightsResult, 'source'> {
  const base = buildAssignmentInsights(input);
  return {
    overview: [base.summary, ...base.strengths].join(' '),
    issues: base.improvements.map((problem) => ({ question: 0, problem, action: '' })),
    suggestions: base.suggestions,
  };
}

export function buildInsightsPrompt(input: PromptInput): string {
  const payload = {
    loai_bai: input.assignmentType,
    so_bai_nop: input.submittedCount,
    diem_trung_binh_phan_tram: input.avgScore,
    ti_le_dat_tu_50_phan_tram: input.passRate,
    cau_hoi: input.questions.map((q) => ({
      so: q.sort_order,
      loai: q.type,
      noi_dung: q.content,
      so_HS_dung: q.correctCount,
      so_HS_sai: q.incorrectCount,
      so_HS_chua_tra_loi: q.unansweredCount,
      ti_le_dung_phan_tram: q.correctRate,
    })),
  };
  return `Dữ liệu tổng hợp của một bài kiểm tra (không có thông tin cá nhân học sinh):
${JSON.stringify(payload, null, 2)}

Trả về đúng một JSON object theo cấu trúc:
{"overview": string, "issues": [{"question": number, "problem": string, "action": string}], "suggestions": [string]}`;
}

export function parseAiInsights(text: string): Omit<InsightsResult, 'source'> | null {
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
  if (typeof o.overview !== 'string' || o.overview.trim() === '') return null;

  const issues = Array.isArray(o.issues)
    ? o.issues.flatMap((item) => {
        if (!item || typeof item !== 'object') return [];
        const r = item as Record<string, unknown>;
        if (typeof r.problem !== 'string' || r.problem.trim() === '') return [];
        return [
          {
            question: typeof r.question === 'number' ? r.question : 0,
            problem: r.problem.slice(0, 300),
            action: typeof r.action === 'string' ? r.action.slice(0, 300) : '',
          },
        ];
      }).slice(0, 8)
    : [];

  const suggestions = Array.isArray(o.suggestions)
    ? o.suggestions
        .filter((s): s is string => typeof s === 'string' && s.trim() !== '')
        .map((s) => s.slice(0, 300))
        .slice(0, 6)
    : [];

  return { overview: o.overview.slice(0, 1000), issues, suggestions };
}

const STRONG_RATE = 70;
const WEAK_RATE = 50;
const LOW_AVG = 60;
const UNANSWERED_SHARE = 0.2;
const MAX_SUGGESTIONS = 3;

export function buildAssignmentInsights(input: InsightInput): AssignmentInsights {
  if (input.submittedCount === 0) {
    return {
      summary: 'Chưa có bài nộp nào để nhận định.',
      strengths: [],
      improvements: [],
      suggestions: [],
    };
  }

  const strengths: string[] = [];
  const improvements: string[] = [];
  const suggestions: string[] = [];

  const strong = input.questions.filter((q) => q.correctRate >= STRONG_RATE);
  const weak = input.questions.filter((q) => q.correctRate < WEAK_RATE);

  for (const q of strong) {
    strengths.push(`Câu ${q.sort_order}: ${q.correctRate}% đúng, lớp nắm vững.`);
  }
  if (strong.length === 0) {
    strengths.push(`Chưa có câu nào đạt trên ${STRONG_RATE}% đúng.`);
  }

  if (input.avgScore < LOW_AVG) {
    improvements.push(`Điểm trung bình ${input.avgScore}% còn thấp, dưới ${LOW_AVG}%.`);
  }
  for (const q of weak) {
    improvements.push(`Câu ${q.sort_order}: chỉ ${q.correctRate}% đúng, ${q.incorrectCount} HS làm sai.`);
  }
  for (const q of input.questions) {
    const total = q.correctCount + q.incorrectCount + q.unansweredCount;
    if (total > 0 && q.unansweredCount / total > UNANSWERED_SHARE) {
      improvements.push(`Câu ${q.sort_order}: ${q.unansweredCount} HS chưa trả lời, cần kiểm tra thời gian làm bài.`);
    }
  }

  for (const q of weak.slice(0, MAX_SUGGESTIONS)) {
    suggestions.push(`Giảng lại câu ${q.sort_order} trước khi giao bài mới, tập trung vào lỗi ${q.incorrectCount} HS đã mắc.`);
  }
  if (input.avgScore < LOW_AVG) {
    suggestions.push('Giao thêm bài luyện ngắn cùng dạng để củng cố trước bài kiểm tra tiếp theo.');
  }
  if (strong.length > 0) {
    suggestions.push(`Giữ cách dạy đã hiệu quả ở câu ${strong.map((q) => q.sort_order).join(', ')} cho các bài sau.`);
  }
  if (weak.length === 0 && input.avgScore >= LOW_AVG) {
    suggestions.push('Lớp đạt tốt, có thể chuyển sang nội dung nâng cao.');
  }

  return {
    summary: `${input.submittedCount} bài nộp, điểm trung bình ${input.avgScore}%, ${input.passRate}% đạt từ 50% trở lên.`,
    strengths,
    improvements,
    suggestions,
  };
}
