import { describe, it, expect } from 'vitest';
import { gradeLessonQuestion, isReviewableLessonQuestion } from '@/lib/lessons/grade';
import type { QuestionBlock } from '@/lib/lessons/schema';

const single: QuestionBlock = {
  type: 'question',
  questionType: 'single_choice',
  content: 'Đơn vị của lực là gì?',
  options: [{ id: 'a', text: 'Niutơn' }, { id: 'b', text: 'Jun' }],
  correctAnswer: 'a',
  points: 10,
};

const short: QuestionBlock = {
  ...single,
  questionType: 'short_answer',
  options: undefined,
  correctAnswer: ['Ti thể', 'ti thể'],
};

describe('gradeLessonQuestion', () => {
  it('chấm đúng trắc nghiệm 1 đáp án', () => {
    expect(gradeLessonQuestion(single, 'a')).toBe(true);
    expect(gradeLessonQuestion(single, 'b')).toBe(false);
  });

  it('trả lời ngắn không phân biệt hoa thường và khoảng trắng thừa', () => {
    expect(gradeLessonQuestion(short, '  TI THỂ ')).toBe(true);
    expect(gradeLessonQuestion(short, 'lục lạp')).toBe(false);
  });

  it('chỉ nhận dạng có thể chấm lại trong trạm sửa lỗi', () => {
    expect(isReviewableLessonQuestion(single)).toBe(true);
    expect(isReviewableLessonQuestion({ ...single, questionType: 'multiple_choice' })).toBe(false);
  });
});
