import { describe, it, expect } from 'vitest';
import {
  buildCommentEvidence,
  buildCommentPrompt,
  parseCommentDraft,
} from '@/lib/reports/student-comment';

const q = (is_correct: boolean | null, content = 'Câu hỏi về mạch điện kín') => ({
  question_content: content,
  is_correct,
  assignment_title: 'Kiểm tra mạch điện',
});

describe('buildCommentEvidence', () => {
  it('is insufficient with fewer than three answered questions', () => {
    const e = buildCommentEvidence({
      submissions: [{ status: 'graded', total_score: 2, max_score: 2 }],
      question_details: [q(true), q(null)],
      skill_breakdown: [],
    });
    expect(e.sufficient).toBe(false);
    expect(e.answeredCount).toBe(1);
  });

  it('counts correct and incorrect answers and ignores unanswered ones', () => {
    const e = buildCommentEvidence({
      submissions: [
        { status: 'graded', total_score: 4, max_score: 6 },
        { status: 'draft', total_score: null, max_score: null },
      ],
      question_details: [q(true), q(true), q(true), q(true), q(false), q(false), q(null)],
      skill_breakdown: [{ skill: 'nguon-dien', correct: 2, total: 2, accuracy: 100 }],
    });
    expect(e.sufficient).toBe(true);
    expect(e.correctCount).toBe(4);
    expect(e.incorrectCount).toBe(2);
    expect(e.pendingCount).toBe(1);
    expect(e.averagePercent).toBe(67);
  });

  it('truncates long question text', () => {
    const e = buildCommentEvidence({
      submissions: [],
      question_details: [q(true, 'x'.repeat(400)), q(true), q(true)],
      skill_breakdown: [],
    });
    expect(e.questions[0].question_content.length).toBe(160);
  });
});

describe('parseCommentDraft', () => {
  const good = JSON.stringify({
    summary:
      'Em đã trả lời đúng 4 trên 6 câu, cho thấy em hiểu nguồn điện và mạch điện kín. Em cần củng cố thêm cách mắc các bộ phận trong mạch. Em hãy thử vẽ một mạch gồm pin, công tắc và bóng đèn rồi giải thích khi công tắc đóng hoặc mở.',
    strengths: ['Hiểu nguồn điện'],
    improvements: ['Cách mắc mạch điện'],
    next_steps: ['Tự vẽ mạch pin, công tắc, bóng đèn'],
    evidence: ['4/6 câu đúng'],
  });

  it('accepts a well-formed draft', () => {
    const d = parseCommentDraft(good);
    expect(d?.summary.startsWith('Em đã trả lời')).toBe(true);
    expect(d?.next_steps).toHaveLength(1);
  });

  it('rejects output that leaks JSON field names or braces', () => {
    const leaked = JSON.stringify({ summary: 'summary: em làm tốt nhiều phần của bài kiểm tra này.', strengths: [] });
    expect(parseCommentDraft(leaked)).toBeNull();
  });

  it('rejects a summary that repeats the same sentence', () => {
    const repeated = JSON.stringify({
      summary: 'Em làm bài khá tốt trong tuần này. Em làm bài khá tốt trong tuần này. Em cần thêm luyện tập.',
    });
    expect(parseCommentDraft(repeated)).toBeNull();
  });

  it('rejects invalid JSON and very short summaries', () => {
    expect(parseCommentDraft('không phải json')).toBeNull();
    expect(parseCommentDraft(JSON.stringify({ summary: 'Tốt.' }))).toBeNull();
  });

  it('deduplicates and caps list items', () => {
    const d = parseCommentDraft(
      JSON.stringify({
        summary: 'Em đã có tiến bộ rõ rệt trong việc nhận diện mạch điện kín trong bài học này.',
        strengths: ['a đẹp', 'a đẹp', 'b đẹp', 'c đẹp'],
      }),
    );
    expect(d?.strengths).toEqual(['a đẹp', 'b đẹp']);
  });
});

describe('buildCommentPrompt', () => {
  it('contains evidence but no student identity fields', () => {
    const e = buildCommentEvidence({
      submissions: [],
      question_details: [q(true), q(false), q(true)],
      skill_breakdown: [],
    });
    const prompt = buildCommentPrompt(e);
    expect(prompt).toContain('so_cau_da_tra_loi');
    expect(prompt).not.toMatch(/display_name|student_id|room/i);
  });
});
