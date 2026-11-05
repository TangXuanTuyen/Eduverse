import { describe, it, expect } from 'vitest';
import { getStemQuestion, gradeStemAnswer, STEM_QUIZZES } from '@/lib/stem/quizzes';

describe('gradeStemAnswer', () => {
  it('chấm câu chọn một', () => {
    const q = getStemQuestion('xe-dap-phat-dien', 'q2')!;
    expect(gradeStemAnswer(q, 'C')).toBe(true);
    expect(gradeStemAnswer(q, 'A')).toBe(false);
  });

  it('câu chọn nhiều phải đủ và không thừa', () => {
    const q = getStemQuestion('thuy-dien', 'q2')!;
    expect(gradeStemAnswer(q, ['eta', 'H', 'Q'])).toBe(true);
    expect(gradeStemAnswer(q, ['H', 'Q'])).toBe(false);
    expect(gradeStemAnswer(q, ['H', 'Q', 'eta', 'weather'])).toBe(false);
  });

  it('chấm câu của bài pin Volta', () => {
    const q = getStemQuestion('pin-volta', 'q1')!;
    expect(gradeStemAnswer(q, 'Zn_to_Cu')).toBe(true);
    expect(gradeStemAnswer(q, 'Cu_to_Zn')).toBe(false);
  });

  it('không có câu hỏi ngoài kho', () => {
    expect(getStemQuestion('pin-volta', 'q9')).toBeNull();
    expect(getStemQuestion('thuy-dien', 'q9')).toBeNull();
  });

  it('đáp án đúng luôn nằm trong các lựa chọn', () => {
    for (const quiz of Object.values(STEM_QUIZZES)) {
      for (const q of quiz.questions) {
        const ids = q.options.map((o) => o.id);
        expect(q.correct.every((c) => ids.includes(c))).toBe(true);
      }
    }
  });
});
