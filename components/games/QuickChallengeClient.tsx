'use client';

import { useState, useCallback } from 'react';
import { Zap, CheckCircle2, XCircle, ArrowRight, Trophy } from 'lucide-react';
import { AnswerMark } from '@/components/ui/AnswerMark';

type Question = {
  id: string;
  sourceQuestionId: string;
  type: string;
  content: string;
  options: { id: string; text: string }[] | null;
  fromReview: boolean;
  reviewId?: string;
};

type SubmitResult = {
  results: Array<{ sourceQuestionId: string; isCorrect: boolean; explanation: string }>;
  correctCount: number;
  totalQuestions: number;
  xp: {
    gameComplete: number;
    perfectBonus: number;
    totalXp: number;
    level: number;
    capped: boolean;
    newBadges: Array<{ id: string; name: string; icon: string }>;
  };
};

type Phase = 'loading' | 'playing' | 'feedback' | 'finished';

export function QuickChallengeClient({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [challengeId, setChallengeId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Map<string, { answer: string; fromReview: boolean; reviewId?: string }>>(new Map());
  const [currentFeedback, setCurrentFeedback] = useState<{ isCorrect: boolean; explanation: string } | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState('');

  const startChallenge = useCallback(async () => {
    setPhase('loading');
    try {
      const res = await fetch('/api/game/quick-challenge/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Lỗi'); return; }
      setChallengeId(data.challengeId);
      setQuestions(data.questions);
      setCurrentIdx(0);
      setAnswers(new Map());
      setPhase('playing');
    } catch {
      setError('Không thể tải câu hỏi');
    }
  }, []);

  const handleAnswer = async (optionId: string) => {
    if (phase !== 'playing') return;
    const q = questions[currentIdx];
    answers.set(q.sourceQuestionId, { answer: optionId, fromReview: q.fromReview, reviewId: q.reviewId });
    setAnswers(new Map(answers));

    // Show immediate feedback by grading locally (we'll verify server-side at submit)
    // For now, just move to next
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Submit all
      setPhase('loading');
      try {
        const res = await fetch('/api/game/quick-challenge/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            challengeId,
            answers: Array.from(answers.entries()).map(([sourceQuestionId, a]) => ({
              sourceQuestionId,
              answer: a.answer,
              fromReview: a.fromReview,
              reviewId: a.reviewId,
            })),
          }),
        });
        const data = await res.json();
        setResult(data);
        setPhase('finished');
      } catch {
        setError('Lỗi gửi kết quả');
      }
    }
  };

  // Start on mount
  if (phase === 'loading' && !challengeId && !error) {
    startChallenge();
  }

  const q = questions[currentIdx];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-bold text-white">Thử thách nhanh</span>
        </div>
        {phase === 'playing' && (
          <span className="text-xs text-slate-400">
            Câu {currentIdx + 1}/{questions.length}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {phase === 'playing' && (
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-300"
            style={{ width: `${((currentIdx) / questions.length) * 100}%` }}
          />
        </div>
      )}

      {/* Loading */}
      {phase === 'loading' && !error && (
        <div className="text-center py-12 text-slate-400">
          <div className="animate-pulse">Đang tải câu hỏi...</div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-8 space-y-3">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-800 text-sm text-white min-h-[44px]">
            Đóng
          </button>
        </div>
      )}

      {/* Question */}
      {phase === 'playing' && q && (
        <div className="space-y-4">
          {q.fromReview && (
            <div className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-1 rounded inline-block">
              📝 Câu ôn tập
            </div>
          )}
          <p className="text-sm text-white font-medium">{q.content}</p>
          <div className="grid gap-2">
            {(q.options ?? []).map((opt: { id: string; text: string }) => (
              <button
                key={opt.id}
                onClick={() => handleAnswer(opt.id)}
                className="w-full text-left px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 text-sm text-slate-200 transition min-h-[44px]"
              >
                <span className="font-bold text-cyan-400 mr-2">{opt.id.toUpperCase()}.</span>
                {opt.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Finished */}
      {phase === 'finished' && result && (
        <div className="space-y-4 text-center">
          <Trophy className="w-10 h-10 text-amber-400 mx-auto" />
          <div className="text-xl font-bold text-white">
            {result.correctCount}/{result.totalQuestions} câu đúng
          </div>

          {/* Per-question results */}
          <div className="space-y-2 text-left">
            {result.results.map((r, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/50">
                {r.isCorrect ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="text-xs">
                  <p className="text-slate-300">{questions[i]?.content}</p>
                  {!r.isCorrect && r.explanation && (
                    <p className="text-slate-500 mt-1">{r.explanation}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* XP earned */}
          <div className="bg-amber-500/10 rounded-xl p-3 space-y-1">
            <div className="text-amber-400 text-sm font-bold">
              +{result.xp.gameComplete + result.xp.perfectBonus} XP
            </div>
            {result.xp.perfectBonus > 0 && (
              <div className="text-[10px] text-amber-300">Bao gồm +{result.xp.perfectBonus} XP hoàn hảo!</div>
            )}
            {result.xp.capped && (
              <div className="text-[10px] text-slate-500">Đã đạt giới hạn XP hôm nay</div>
            )}
          </div>

          {/* New badges */}
          {result.xp.newBadges.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-amber-400 font-bold">🏆 Huy hiệu mới!</div>
              {result.xp.newBadges.map((b) => (
                <div key={b.id} className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10">
                  <span className="text-lg">{b.icon}</span>
                  <span className="text-xs text-white font-medium">{b.name}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={startChallenge} className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-sm text-white font-medium min-h-[44px]">
              Chơi lại
            </button>
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm text-white min-h-[44px]">
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
