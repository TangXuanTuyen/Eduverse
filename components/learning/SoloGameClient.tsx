'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Trophy, Clock, CheckCircle, XCircle, Zap, ArrowRight } from 'lucide-react';

type QuestionData = {
  id: string;
  content: string;
  options: { id: string; text: string }[] | null;
  type: string;
  points: number;
  totalQuestions: number;
};
type AnswerResult = {
  isCorrect: boolean | null;
  score: number;
  streak: number;
  timeMs: number;
};

type Props = {
  sessionId: string;
  initialQuestion: QuestionData | null;
  totalQuestions: number;
  timePerQuestion: number;
  onClose: () => void;
};

export function SoloGameClient({ sessionId, initialQuestion, totalQuestions, timePerQuestion, onClose }: Props) {
  const [phase, setPhase] = useState<'question' | 'feedback' | 'finished'>('question');
  const [question, setQuestion] = useState<QuestionData | null>(initialQuestion);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (phase !== 'question' || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((v) => {
        if (v <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return v - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, timeLeft > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswer = useCallback(async (answerId: string) => {
    if (submitting || selectedAnswer || !question) return;
    setSelectedAnswer(answerId);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/game/${sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, answer: answerId }),
      });
      const data = await res.json();
      if (!data.error) {
        setAnswerResult(data);
        setTotalScore((s) => s + (data.score ?? 0));
        if (data.isCorrect) setCorrectCount((c) => c + 1);
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
      setPhase('feedback');
    }
  }, [submitting, selectedAnswer, question, sessionId]);

  const handleNext = useCallback(async () => {
    try {
      const res = await fetch('/api/game/solo/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();

      if (data.finished) {
        setPhase('finished');
      } else if (data.question) {
        setQuestion({ ...data.question, totalQuestions });
        setQuestionIndex((i) => i + 1);
        setTimeLeft(timePerQuestion);
        setSelectedAnswer(null);
        setAnswerResult(null);
        setPhase('question');
      }
    } catch {
      // ignore
    }
  }, [sessionId, totalQuestions, timePerQuestion]);

  if (phase === 'finished' || (!question && phase !== 'feedback')) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-6">
        <Trophy className="w-16 h-16 mx-auto text-yellow-400" />
        <h1 className="text-2xl font-bold">Hoàn thành!</h1>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <p className="text-sm text-slate-400">Tổng điểm</p>
          <p className="text-4xl font-bold text-green-400">{totalScore}</p>
          <p className="text-sm text-slate-400">
            Đúng {correctCount}/{totalQuestions} câu
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg bg-slate-700 hover:bg-slate-600 px-6 py-3 text-sm text-white min-h-[44px]"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const optionColors = ['bg-red-600', 'bg-blue-600', 'bg-yellow-600', 'bg-green-600'];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">
          Câu {questionIndex + 1}/{totalQuestions}
        </span>
        <span className={`text-2xl font-bold font-mono ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
          <Clock size={18} className="inline mr-1" />{timeLeft}s
        </span>
        <span className="text-sm text-green-400 font-medium">{totalScore} đ</span>
      </div>

      {question && (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-lg text-white font-medium leading-relaxed">{question.content}</p>
          </div>

          {question.options && (
            <div className="grid grid-cols-1 gap-3">
              {question.options.map((o, i) => {
                const isSelected = selectedAnswer === o.id;
                const showResult = phase === 'feedback' && isSelected && answerResult;
                let bgClass = optionColors[i] ?? 'bg-slate-600';
                if (showResult) {
                  bgClass = answerResult!.isCorrect ? 'bg-green-600 ring-2 ring-green-400' : 'bg-red-700 ring-2 ring-red-400';
                } else if (selectedAnswer && !isSelected) {
                  bgClass = 'bg-slate-700 opacity-50';
                }
                return (
                  <button
                    key={o.id}
                    onClick={() => handleAnswer(o.id)}
                    disabled={!!selectedAnswer || timeLeft === 0}
                    className={`p-4 rounded-xl text-white font-medium text-left transition-all min-h-[52px] ${bgClass} ${
                      !selectedAnswer && timeLeft > 0 ? 'hover:brightness-110 active:scale-[0.98] cursor-pointer' : ''
                    }`}
                  >
                    <span className="font-mono mr-2 opacity-70">{o.id.toUpperCase()}.</span>
                    {o.text}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {phase === 'feedback' && answerResult && (
        <div className="space-y-3">
          <div className={`flex items-center justify-center gap-2 text-lg font-bold ${
            answerResult.isCorrect ? 'text-green-400' : 'text-red-400'
          }`}>
            {answerResult.isCorrect
              ? <><CheckCircle size={24} /> Đúng! +{answerResult.score} điểm</>
              : <><XCircle size={24} /> Sai rồi</>
            }
          </div>
          <div className="flex justify-center">
            <button
              onClick={handleNext}
              className="rounded-lg bg-purple-600 hover:bg-purple-500 px-6 py-3 text-sm font-medium text-white flex items-center gap-2 min-h-[44px]"
            >
              {questionIndex + 1 < totalQuestions ? 'Câu tiếp' : 'Xem kết quả'}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {timeLeft === 0 && !selectedAnswer && phase === 'question' && (
        <div className="text-center space-y-3">
          <p className="text-red-400 font-medium">Hết giờ!</p>
          <button
            onClick={handleNext}
            className="rounded-lg bg-slate-700 hover:bg-slate-600 px-6 py-3 text-sm text-white min-h-[44px]"
          >
            Câu tiếp
          </button>
        </div>
      )}
    </div>
  );
}
