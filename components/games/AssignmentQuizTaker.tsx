'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle2, XCircle, ArrowRight, Trophy, ArrowLeft } from 'lucide-react';

type Question = {
  id: string;
  sort_order: number;
  type: string;
  content: string;
  options: { id: string; text: string }[] | null;
  explanation: string | null;
  points: number;
};

type AssignmentInfo = {
  id: string;
  title: string;
  description: string | null;
  due_at: string | null;
};

type SubmitResult = {
  totalScore: number;
  maxScore: number;
  xpAwarded: number;
  isLate: boolean;
};

type Phase = 'loading' | 'playing' | 'submitting' | 'results' | 'already_done' | 'error';

export function AssignmentQuizTaker({
  assignmentId,
  onBack,
}: {
  assignmentId: string;
  onBack: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [assignment, setAssignment] = useState<AssignmentInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/assignment-quiz/${assignmentId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setPhase('error');
          return;
        }
        setAssignment(data.assignment);
        setQuestions(data.questions);

        if (data.existingSubmission && data.existingSubmission.status !== 'draft') {
          setResult({
            totalScore: data.existingSubmission.total_score ?? 0,
            maxScore: data.existingSubmission.max_score ?? 0,
            xpAwarded: 0,
            isLate: false,
          });
          setPhase('already_done');
        } else if (data.questions.length === 0) {
          setError('Bài kiểm tra chưa có câu hỏi.');
          setPhase('error');
        } else {
          setPhase('playing');
        }
      })
      .catch(() => {
        setError('Không thể tải bài kiểm tra');
        setPhase('error');
      });
  }, [assignmentId]);

  const handleSelect = useCallback((questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }, []);

  const handleSubmit = useCallback(async () => {
    setPhase('submitting');
    try {
      const res = await fetch(`/api/assignment-quiz/${assignmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Lỗi nộp bài');
        setPhase('error');
        return;
      }
      setResult(data);
      setPhase('results');
    } catch {
      setError('Không thể nộp bài');
      setPhase('error');
    }
  }, [assignmentId, answers]);

  if (phase === 'loading' || phase === 'submitting') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        <p className="text-sm text-slate-400">
          {phase === 'loading' ? 'Đang tải bài kiểm tra...' : 'Đang nộp bài...'}
        </p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <XCircle className="w-10 h-10 text-red-400" />
        <p className="text-sm text-red-300">{error}</p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm min-h-[44px]"
        >
          Quay lại
        </button>
      </div>
    );
  }

  if (phase === 'already_done' && result) {
    const pct = result.maxScore > 0 ? Math.round((result.totalScore / result.maxScore) * 100) : 0;
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-400" />
        <h3 className="text-lg font-bold text-white">Đã hoàn thành</h3>
        <p className="text-sm text-slate-300">
          Bạn đã làm bài này rồi: <span className="text-white font-bold">{result.totalScore}/{result.maxScore}</span> ({pct}%)
        </p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm min-h-[44px]"
        >
          Quay lại Đấu Trường
        </button>
      </div>
    );
  }

  if (phase === 'results' && result) {
    const pct = result.maxScore > 0 ? Math.round((result.totalScore / result.maxScore) * 100) : 0;
    const perfect = result.totalScore === result.maxScore && result.maxScore > 0;
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${perfect ? 'bg-yellow-600/30 border border-yellow-500/50' : 'bg-green-600/30 border border-green-500/50'}`}>
          {perfect ? <Trophy className="w-8 h-8 text-yellow-400" /> : <CheckCircle2 className="w-8 h-8 text-green-400" />}
        </div>
        <h3 className="text-xl font-bold text-white">
          {perfect ? 'Xuất sắc!' : pct >= 70 ? 'Tốt lắm!' : pct >= 50 ? 'Cố gắng thêm!' : 'Cần ôn tập thêm!'}
        </h3>
        <p className="text-3xl font-bold text-white">{result.totalScore}/{result.maxScore}</p>
        <p className="text-sm text-slate-400">{pct}% đúng</p>
        {result.xpAwarded > 0 && (
          <div className="px-4 py-2 rounded-xl bg-purple-600/30 border border-purple-500/50">
            <span className="text-purple-300 font-bold text-lg">+{result.xpAwarded} XP</span>
          </div>
        )}
        {result.isLate && (
          <p className="text-xs text-amber-400">⚠ Nộp muộn</p>
        )}
        <button
          type="button"
          onClick={onBack}
          className="mt-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold min-h-[44px]"
        >
          Quay lại Đấu Trường
        </button>
      </div>
    );
  }

  // Playing phase
  const q = questions[currentIdx];
  const totalQ = questions.length;
  const answered = Object.keys(answers).length;
  const allAnswered = answered === totalQ;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition min-h-[44px] px-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Menu
        </button>
        <div className="text-right">
          <p className="text-xs text-purple-300 font-medium">{assignment?.title}</p>
          <p className="text-[10px] text-slate-500">Câu {currentIdx + 1}/{totalQ} · Đã trả lời {answered}/{totalQ}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-500 rounded-full transition-all"
          style={{ width: `${((currentIdx + 1) / totalQ) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
        <p className="text-sm text-slate-400 mb-1">Câu {currentIdx + 1} ({q.points} điểm)</p>
        <p className="text-white font-medium">{q.content}</p>
      </div>

      {/* Options */}
      {q.options && (
        <div className="space-y-2">
          {q.options.map((opt) => {
            const selected = answers[q.id] === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(q.id, opt.id)}
                className={`w-full text-left p-3 rounded-xl border transition min-h-[44px] ${
                  selected
                    ? 'bg-purple-600/30 border-purple-500/60 text-white'
                    : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                <span className="text-sm">{opt.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* For short_answer type */}
      {q.type === 'short_answer' && (
        <input
          type="text"
          value={(answers[q.id] as string) ?? ''}
          onChange={(e) => handleSelect(q.id, e.target.value)}
          placeholder="Nhập câu trả lời..."
          className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm min-h-[44px]"
        />
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
          disabled={currentIdx === 0}
          className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm min-h-[44px] disabled:opacity-30"
        >
          ← Trước
        </button>

        {currentIdx < totalQ - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentIdx(currentIdx + 1)}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium min-h-[44px] flex items-center gap-1"
          >
            Tiếp <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-bold min-h-[44px] disabled:opacity-50"
          >
            Nộp bài ({answered}/{totalQ})
          </button>
        )}
      </div>

      {/* Question dots for quick nav */}
      <div className="flex flex-wrap gap-1.5 justify-center pt-1">
        {questions.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrentIdx(i)}
            className={`w-7 h-7 rounded-full text-[10px] font-bold min-w-[28px] min-h-[28px] flex items-center justify-center transition ${
              i === currentIdx
                ? 'bg-purple-600 text-white'
                : answers[questions[i].id]
                  ? 'bg-purple-900/50 text-purple-300 border border-purple-500/30'
                  : 'bg-slate-800 text-slate-500'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
