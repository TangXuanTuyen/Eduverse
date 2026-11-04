import type { QuestionBlock } from '@/lib/lessons/schema';

/** Chấm một câu hỏi trong bài học. Chỉ dạng trắc nghiệm 1 đáp án và trả lời ngắn được chấm tự động. */
export function gradeLessonQuestion(block: QuestionBlock, answer: unknown): boolean {
  if (block.questionType === 'single_choice') {
    return answer === block.correctAnswer;
  }
  if (block.questionType === 'short_answer') {
    const normalize = (v: unknown) => String(v ?? '').trim().toLowerCase();
    const accepted = Array.isArray(block.correctAnswer)
      ? (block.correctAnswer as string[]).map(normalize)
      : [normalize(block.correctAnswer)];
    return accepted.includes(normalize(answer));
  }
  return false;
}

/** Dạng câu hỏi có thể đưa vào Trạm Sửa Lỗi (đủ dữ liệu để hiển thị và chấm lại). */
export function isReviewableLessonQuestion(block: QuestionBlock): boolean {
  return block.questionType === 'single_choice' || block.questionType === 'short_answer';
}
