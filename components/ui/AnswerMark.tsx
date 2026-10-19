import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

/**
 * Dấu ✓/✗ kèm chữ cho trình đọc màn hình, để đúng/sai không chỉ được báo bằng màu.
 */
export function AnswerMark({ correct, chosen }: { correct: boolean; chosen: boolean }) {
  if (correct) {
    return (
      <span className="ml-auto shrink-0 inline-flex items-center gap-1 text-emerald-300">
        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
        <span className="sr-only">Đáp án đúng</span>
      </span>
    );
  }
  if (chosen) {
    return (
      <span className="ml-auto shrink-0 inline-flex items-center gap-1 text-rose-300">
        <XCircle className="w-4 h-4" aria-hidden="true" />
        <span className="sr-only">Bạn đã chọn, chưa đúng</span>
      </span>
    );
  }
  return null;
}
