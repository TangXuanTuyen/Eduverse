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
