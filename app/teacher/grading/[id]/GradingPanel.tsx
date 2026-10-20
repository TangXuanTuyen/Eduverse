'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { gradeAttemptAction, finalizeAction } from './actions';
import type { AttemptForGrading } from '@/services/grading';

const FEEDBACK_TEMPLATES = [
  'Tốt lắm!',
  'Cần bổ sung thêm chi tiết.',
  'Sai khái niệm, xem lại bài học.',
  'Đúng hướng nhưng chưa đầy đủ.',
  'Xuất sắc!',
];

type Props = {
  submissionId: string;
  attempts: AttemptForGrading[];
};

export function GradingPanel({ submissionId, attempts }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [message, setMessage] = useState('');

  const sorted = [...attempts].sort(
    (a, b) => (a.question?.sort_order ?? 0) - (b.question?.sort_order ?? 0)
  );

  async function handleGrade(attemptId: string, score: number, feedback: string | null) {
    setSaving(true);
    const result = await gradeAttemptAction(attemptId, score, feedback);
    setSaving(false);
    if (result.error) setMessage(result.error);
  }

  async function handleFinalize() {
    setFinalizing(true);
    const result = await finalizeAction(submissionId);
    setFinalizing(false);
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage('Đã hoàn tất chấm bài!');
      setTimeout(() => router.push('/teacher/grading'), 1000);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Chấm bài</h1>
        <button
          type="button"
          onClick={() => router.push('/teacher/grading')}
          className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]"
        >
          Quay lại
        </button>
      </div>

      {message && (
        <p className={`text-sm ${message.includes('!') ? 'text-green-400' : 'text-red-400'}`}>{message}</p>
      )}

      {sorted.map((a, i) => (
        <AttemptCard
          key={a.id}
          index={i + 1}
          attempt={a}
          onGrade={handleGrade}
          saving={saving}
        />
      ))}

      <div className="pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={handleFinalize}
          disabled={finalizing}
          className="rounded-lg bg-green-600 hover:bg-green-500 px-6 py-2 text-sm font-medium text-white disabled:opacity-50 min-h-[44px]"
        >
          {finalizing ? 'Đang lưu...' : 'Hoàn tất chấm bài'}
        </button>
      </div>
    </div>
  );
}

function AttemptCard({
  index,
  attempt: a,
  onGrade,
  saving,
}: {
  index: number;
  attempt: AttemptForGrading;
  onGrade: (attemptId: string, score: number, feedback: string | null) => void;
  saving: boolean;
}) {
  const q = a.question;
  const [score, setScore] = useState(a.score ?? 0);
  const [feedback, setFeedback] = useState(a.feedback ?? '');
  const needsManual = q.type === 'essay' || a.is_correct === null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-slate-400">Câu {index} · {q.type} · {q.points} điểm</p>
          <p className="text-sm text-white mt-1">{q.content}</p>
        </div>
        {a.is_correct !== null && (
          <span className={`text-xs px-2 py-0.5 rounded ${a.is_correct ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
            {a.is_correct ? 'Đúng' : 'Sai'}
          </span>
        )}
      </div>

      <div className="bg-slate-800 rounded-lg p-3">
        <p className="text-xs text-slate-400 mb-1">Câu trả lời:</p>
        <p className="text-sm text-white whitespace-pre-wrap">
          {a.student_answer != null ? String(a.student_answer) : '(Chưa trả lời)'}
        </p>
      </div>

      {q.correct_answer != null && (
        <div className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Đáp án đúng:</p>
          <p className="text-sm text-green-300">{JSON.stringify(q.correct_answer)}</p>
        </div>
      )}

      {needsManual && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400">Điểm:</label>
            <input
              type="number"
              min={0}
              max={q.points}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-20 rounded-lg bg-slate-800 border border-slate-700 px-2 py-1 text-sm text-white"
            />
            <span className="text-xs text-slate-500">/ {q.points}</span>
          </div>

          <div>
            <label className="text-xs text-slate-400">Nhận xét:</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white resize-y"
            />
            <div className="flex flex-wrap gap-1 mt-1">
              {FEEDBACK_TEMPLATES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFeedback(feedback ? `${feedback} ${t}` : t)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded min-h-[32px]"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={() => onGrade(a.id, score, feedback || null)}
            className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm text-white disabled:opacity-50 min-h-[44px]"
          >
            Lưu điểm câu này
          </button>
        </div>
      )}
    </div>
  );
}
