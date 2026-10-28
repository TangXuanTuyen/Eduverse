import { describe, it, expect } from 'vitest';
import {
  buildAssignmentInsights,
  buildInsightsPrompt,
  buildRuleInsights,
  parseAiInsights,
} from '@/lib/reports/assignment-insights';

const q = (sort_order: number, correct: number, incorrect: number, unanswered = 0) => ({
  sort_order,
  correctCount: correct,
  incorrectCount: incorrect,
  unansweredCount: unanswered,
  correctRate: Math.round((correct / Math.max(correct + incorrect + unanswered, 1)) * 100),
});

describe('buildAssignmentInsights', () => {
  it('returns no-data message when nobody submitted', () => {
    const r = buildAssignmentInsights({ submittedCount: 0, avgScore: -1, passRate: -1, questions: [] });
    expect(r.summary).toContain('Chưa có bài nộp');
    expect(r.strengths).toEqual([]);
  });

  it('lists strong questions as strengths and weak ones as improvements', () => {
    const r = buildAssignmentInsights({
      submittedCount: 30,
      avgScore: 72,
      passRate: 80,
      questions: [q(1, 27, 3), q(2, 12, 18)],
    });
    expect(r.strengths.some((s) => s.includes('Câu 1'))).toBe(true);
    expect(r.improvements.some((s) => s.includes('Câu 2') && s.includes('18 HS'))).toBe(true);
    expect(r.suggestions.some((s) => s.includes('Giảng lại câu 2'))).toBe(true);
  });

  it('flags low average and suggests reinforcement', () => {
    const r = buildAssignmentInsights({ submittedCount: 10, avgScore: 45, passRate: 30, questions: [q(1, 4, 6)] });
    expect(r.improvements.some((s) => s.includes('45%'))).toBe(true);
    expect(r.suggestions.some((s) => s.includes('luyện ngắn'))).toBe(true);
  });

  it('flags questions with many unanswered responses', () => {
    const r = buildAssignmentInsights({
      submittedCount: 10,
      avgScore: 80,
      passRate: 90,
      questions: [q(3, 5, 2, 3)],
    });
    expect(r.improvements.some((s) => s.includes('chưa trả lời'))).toBe(true);
  });

  it('suggests advanced content when the whole class is strong', () => {
    const r = buildAssignmentInsights({ submittedCount: 10, avgScore: 90, passRate: 100, questions: [q(1, 10, 0)] });
    expect(r.suggestions.some((s) => s.includes('nội dung nâng cao'))).toBe(true);
  });

  it('maps rule-based result to the insight card shape', () => {
    const r = buildRuleInsights({ submittedCount: 10, avgScore: 45, passRate: 30, questions: [q(1, 4, 6)] });
    expect(r.overview).toContain('10 bài nộp');
    expect(r.issues.every((i) => typeof i.problem === 'string')).toBe(true);
  });
});

describe('parseAiInsights', () => {
  it('accepts a valid JSON object wrapped in prose', () => {
    const text = 'Kết quả:\n{"overview":"Lớp hiểu mạch song song.","issues":[{"question":3,"problem":"Nhầm dòng điện trong mạch nối tiếp","action":"Vẽ sơ đồ mạch"}],"suggestions":["Giảng lại câu 3"]}';
    const r = parseAiInsights(text);
    expect(r?.overview).toBe('Lớp hiểu mạch song song.');
    expect(r?.issues[0]).toEqual({ question: 3, problem: 'Nhầm dòng điện trong mạch nối tiếp', action: 'Vẽ sơ đồ mạch' });
    expect(r?.suggestions).toEqual(['Giảng lại câu 3']);
  });

  it('returns null for malformed output or empty overview', () => {
    expect(parseAiInsights('không có json')).toBeNull();
    expect(parseAiInsights('{"overview":"  ","issues":[]}')).toBeNull();
    expect(parseAiInsights('{bad json}')).toBeNull();
  });

  it('drops issues without a problem text and caps list lengths', () => {
    const issues = Array.from({ length: 12 }, (_, i) => ({ question: i + 1, problem: `Vấn đề ${i + 1}`, action: '' }));
    const text = JSON.stringify({ overview: 'x', issues: [...issues, { question: 99 }], suggestions: [] });
    const r = parseAiInsights(text);
    expect(r?.issues.length).toBe(8);
    expect(r?.issues.some((i) => i.question === 99)).toBe(false);
  });
});

describe('buildInsightsPrompt', () => {
  it('includes question data and no student identity fields', () => {
    const prompt = buildInsightsPrompt({
      assignmentType: 'quiz',
      submittedCount: 5,
      avgScore: 50,
      passRate: 40,
      questions: [{ ...q(1, 2, 3), content: 'Hiệu điện thế nguồn 12V?', type: 'single_choice' }],
    });
    expect(prompt).toContain('Hiệu điện thế nguồn 12V?');
    expect(prompt).toContain('so_HS_sai');
    expect(prompt).not.toMatch(/display_name|student_id|lớp của/);
  });
});
