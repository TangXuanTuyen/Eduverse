'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DialogFrame } from '@/components/ui/DialogFrame';
import { STUDENT_HOME } from '@/lib/student-routes';
import { saveDraftAction, submitAction } from './actions';

type Question = {
  id: string;
  sort_order: number;
  type: string;
  content: string;
  options: { id: string; text: string }[] | null;
  points: number;
};

type Props = {
  assignment: { id: string; title: string; due_at: string | null };
  questions: Question[];
  submission: { id: string; status: string };
  savedAnswers: Record<string, unknown>;
};

export function AssignmentTaker({ assignment, questions, submission, savedAnswers }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, unknown>>(savedAnswers);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'offline'>('saved');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success?: string; error?: string; result?: Record<string, unknown> } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const isSubmitted = submission.status !== 'draft';

  const doSave = useCallback(async () => {
    if (isSubmitted) return;
    setSaveStatus('saving');
    try {
      const { error } = await saveDraftAction(submission.id, answersRef.current);
      setSaveStatus(error ? 'unsaved' : 'saved');
    } catch {
      setSaveStatus('offline');
      try {
        localStorage.setItem(`draft:${submission.id}`, JSON.stringify(answersRef.current));
      } catch { /* ignore */ }
    }
  }, [submission.id, isSubmitted]);

  const scheduleAutoSave = useCallback(() => {
    if (isSubmitted) return;
    setSaveStatus('unsaved');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(doSave, 3000);
  }, [doSave, isSubmitted]);

  // Flush on online
  useEffect(() => {
    const handler = () => {
      if (saveStatus === 'offline') doSave();
    };
    window.addEventListener('online', handler);
    return () => window.removeEventListener('online', handler);
  }, [saveStatus, doSave]);

  // beforeunload warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'unsaved' || saveStatus === 'saving') {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [saveStatus]);

  function setAnswer(qId: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
    scheduleAutoSave();
  }

  async function handleSubmit() {
    if (isSubmitted) return;
    // Save first
    await doSave();
    setSubmitting(true);
    const result = await submitAction(submission.id);
    setSubmitting(false);
    setSubmitResult(result);
  }

  const close = () => router.push(STUDENT_HOME);

  const saveLabel: Record<string, string> = {
    saved: 'Đã lưu',
    saving: 'Đang lưu...',
    unsaved: 'Chưa lưu',
    offline: 'Offline — đã lưu cục bộ',
  };

  return (
    <DialogFrame
      onClose={close}
      label={assignment.title}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md"
    >
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-blue-500/50 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-blue-500/30 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">{assignment.title}</h2>
            <span className={`text-xs ${saveStatus === 'saved' ? 'text-green-400' : saveStatus === 'offline' ? 'text-amber-400' : 'text-slate-400'}`}>
              {saveLabel[saveStatus]}
            </span>
          </div>
          <button
            type="button"
            onClick={close}
            className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Questions */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {submitResult?.success && (
            <div className="bg-green-900/50 border border-green-500/50 rounded-xl p-4 text-center">
              <p className="text-green-300 font-medium text-lg">{submitResult.success}</p>
              {submitResult.result && (() => {
                const r = submitResult.result as Record<string, unknown>;
                const total = Number(r.totalScore);
                const max = Number(r.maxScore);
                const xp = Number(r.xpAwarded ?? 0);
                const isPerfect = total === max && max > 0;
                return (
                  <>
                    <p className="text-2xl font-bold text-white mt-2">{total}/{max} điểm</p>
                    {xp > 0 && (
                      <p className="text-amber-400 font-bold text-lg mt-1 animate-bounce">
                        +{xp} XP{isPerfect ? ' (hoàn hảo!)' : ''}
                      </p>
                    )}
                    {isPerfect && <p className="text-yellow-300 text-sm mt-1">Xuất sắc! Đạt điểm tuyệt đối!</p>}
                    {!isPerfect && total < max && (
                      <p className="text-slate-400 text-sm mt-2">
                        Ôn lại lý thuyết tại Thư viện hoặc xem thí nghiệm tại Phòng TN Ảo để cải thiện.
                      </p>
                    )}
                  </>
                );
              })()}
              <button
                type="button"
                onClick={close}
                className="mt-3 rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]"
              >
                Quay lại
              </button>
            </div>
          )}

          {submitResult?.error && (
            <p className="text-red-400 text-sm">{submitResult.error}</p>
          )}

          {!submitResult?.success && questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              index={i + 1}
              question={q}
              answer={answers[q.id]}
              onAnswer={(v) => setAnswer(q.id, v)}
              disabled={isSubmitted}
            />
          ))}
        </div>

        {/* Footer */}
        {!isSubmitted && !submitResult?.success && (
          <div className="px-6 py-4 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-lg bg-green-600 hover:bg-green-500 px-6 py-2 text-sm font-medium text-white disabled:opacity-50 min-h-[44px]"
            >
              {submitting ? 'Đang nộp...' : 'Nộp bài'}
            </button>
          </div>
        )}
      </div>
    </DialogFrame>
  );
}

function QuestionCard({
  index,
  question: q,
  answer,
  onAnswer,
  disabled,
}: {
  index: number;
  question: { id: string; type: string; content: string; options: { id: string; text: string }[] | null; points: number };
  answer: unknown;
  onAnswer: (v: unknown) => void;
  disabled: boolean;
}) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex justify-between items-start">
        <p className="text-sm text-white"><span className="text-slate-400">Câu {index}.</span> {q.content}</p>
        <span className="text-xs text-slate-500 shrink-0 ml-2">{q.points} đ</span>
      </div>

      {(q.type === 'single_choice' || q.type === 'multiple_choice') && q.options && (
        <div className="space-y-1.5">
          {q.options.map((opt) => {
            const selected = q.type === 'single_choice'
              ? answer === opt.id
              : Array.isArray(answer) && (answer as string[]).includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (q.type === 'single_choice') {
                    onAnswer(opt.id);
                  } else {
                    const prev = Array.isArray(answer) ? (answer as string[]) : [];
                    onAnswer(
                      prev.includes(opt.id) ? prev.filter((x) => x !== opt.id) : [...prev, opt.id]
                    );
                  }
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition min-h-[44px] ${
                  selected
                    ? 'bg-blue-600/30 border border-blue-500 text-white'
                    : 'bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600'
                } disabled:opacity-50`}
              >
                <span className="font-mono mr-2 text-xs">{opt.id.toUpperCase()}</span>
                {opt.text}
              </button>
            );
          })}
        </div>
      )}

      {q.type === 'short_answer' && (
        <input
          type="text"
          value={typeof answer === 'string' ? answer : ''}
          onChange={(e) => onAnswer(e.target.value)}
          disabled={disabled}
          placeholder="Nhập câu trả lời..."
          className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white disabled:opacity-50"
        />
      )}

      {q.type === 'essay' && (
        <textarea
          value={typeof answer === 'string' ? answer : ''}
          onChange={(e) => onAnswer(e.target.value)}
          disabled={disabled}
          rows={4}
          placeholder="Viết bài làm..."
          className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-white resize-y disabled:opacity-50"
        />
      )}
    </div>
  );
}
