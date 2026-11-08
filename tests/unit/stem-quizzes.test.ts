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

  it('chấm câu nhập số của bài lò xo theo sai số cho phép', () => {
    const q = getStemQuestion('lo-xo-dan-hoi', 'q5')!;
    expect(gradeStemAnswer(q, '75')).toBe(true);
    expect(gradeStemAnswer(q, '72,5')).toBe(true);
    expect(gradeStemAnswer(q, '81')).toBe(false);
    expect(gradeStemAnswer(q, 'abc')).toBe(false);
  });

  it('chấm câu trắc nghiệm của bài lò xo', () => {
    const q = getStemQuestion('lo-xo-dan-hoi', 'q2')!;
    expect(gradeStemAnswer(q, 'B')).toBe(true);
    expect(gradeStemAnswer(q, 'A')).toBe(false);
  });

  it('chấm câu của bài tế bào nhân thực 3D', () => {
    const q = getStemQuestion('te-bao-nhan-thuc-3d', 'q1')!;
    expect(gradeStemAnswer(q, 'A')).toBe(true);
    expect(gradeStemAnswer(q, 'B')).toBe(false);
    expect(STEM_QUIZZES['te-bao-nhan-thuc-3d'].questions).toHaveLength(10);
  });

  it('không có câu hỏi ngoài kho', () => {
    expect(getStemQuestion('pin-volta', 'q9')).toBeNull();
    expect(getStemQuestion('thuy-dien', 'q9')).toBeNull();
  });

  it('đáp án đúng luôn nằm trong các lựa chọn', () => {
    for (const quiz of Object.values(STEM_QUIZZES)) {
      for (const q of quiz.questions) {
        if (q.numeric) continue;
        const ids = q.options.map((o) => o.id);
        expect(q.correct.every((c) => ids.includes(c))).toBe(true);
      }
    }
  });
});

describe('Tế bào nhân sơ 3D', () => {
  it('có 5 câu, chấm đúng theo đáp án gốc', () => {
    expect(STEM_QUIZZES['te-bao-nhan-so-3d'].questions).toHaveLength(5);
    expect(gradeStemAnswer(getStemQuestion('te-bao-nhan-so-3d', 'q1')!, ['B'])).toBe(true);
    expect(gradeStemAnswer(getStemQuestion('te-bao-nhan-so-3d', 'q1')!, ['A'])).toBe(false);
    expect(gradeStemAnswer(getStemQuestion('te-bao-nhan-so-3d', 'q4')!, ['C'])).toBe(true);
  });
});
