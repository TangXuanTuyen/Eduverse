'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Trophy, Clock, CheckCircle, XCircle, Zap } from 'lucide-react';

type GamePhase = 'lobby' | 'question' | 'result' | 'waiting' | 'finished';
type QuestionData = {
  id: string;
  content: string;
  options: { id: string; text: string }[] | null;
  type: string;
  points: number;
  totalQuestions: number;
  questionStartedAt: string | null;
};
type AnswerResult = {
  isCorrect: boolean | null;
  score: number;
  streak: number;
  timeMs: number;
};
type LeaderboardEntry = {
  display_name: string;
  total_score: number;
  user_id: string;
};

type Props = { sessionId: string; userId: string };

export function StudentGameClient({ sessionId, userId }: Props) {
  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [questionIndex, setQuestionIndex] = useState(-1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeLimit, setTimeLimit] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Subscribe to Realtime channel for game events from teacher
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`game:${sessionId}`);

    channel.on('broadcast', { event: 'player_joined' }, () => {
      setPlayerCount((c) => c + 1);
    });

    channel.on('broadcast', { event: 'question_start' }, (payload) => {
      const p = payload.payload as {
        index: number;
        content: string;
        options: { id: string; text: string }[] | null;
        type: string;
        points: number;
        timeLimit: number;
        questionId: string;
        totalQuestions: number;
      };
      setQuestion({
        id: p.questionId,
        content: p.content,
        options: p.options,
        type: p.type,
        points: p.points,
        totalQuestions: p.totalQuestions,
        questionStartedAt: new Date().toISOString(),
      });
      setQuestionIndex(p.index);
      setTimeLimit(p.timeLimit);
      setTimeLeft(p.timeLimit);
      setSelectedAnswer(null);
      setAnswerResult(null);
      setPhase('question');
    });

    channel.on('broadcast', { event: 'question_end' }, (payload) => {
      const p = payload.payload as { leaderboard: LeaderboardEntry[] };
      setLeaderboard(p.leaderboard ?? []);
      setPhase('result');
    });

    channel.on('broadcast', { event: 'game_end' }, (payload) => {
      const p = payload.payload as { finalLeaderboard: LeaderboardEntry[] };
      setLeaderboard(p.finalLeaderboard ?? []);
      setPhase('finished');
    });

    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  // Fetch initial session info (already joined via API)
  useEffect(() => {
    fetch(`/api/game/${sessionId}/info`)
      .then((r) => r.json())
      .then((d) => {
        setPlayerCount((d.players ?? []).length);
        // If the game already has a question in progress, fetch it
        if (d.currentQuestionIndex !== undefined && d.currentQuestionIndex >= 0) {
          fetchCurrentQuestion();
        }
      })
      .catch(() => {});
  }, [sessionId]);

  const fetchCurrentQuestion = useCallback(async () => {
    const res = await fetch(`/api/game/${sessionId}/question`);
    const data = await res.json();
    if (data.question) {
      setQuestion(data.question);
      setQuestionIndex(data.question.sort_order ?? 0);
      setPhase('question');
    }
  }, [sessionId]);

  // Timer countdown
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
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  }, [submitting, selectedAnswer, question, sessionId]);

  // LOBBY
  if (phase === 'lobby') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center">
          <Zap className="w-10 h-10 text-cyan-400" />
        </div>
        <h1 className="text-2xl font-bold">Đang chờ giáo viên...</h1>
        <p className="text-slate-400 text-sm">
          Trò chơi sẽ bắt đầu khi giáo viên nhấn &quot;Bắt đầu&quot;
        </p>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-sm text-slate-400">{playerCount} người chơi đã sẵn sàng</p>
        </div>
        <div className="animate-pulse text-cyan-400 text-sm">Đang kết nối...</div>
      </div>
    );
  }

  // QUESTION
  if (phase === 'question' && question) {
    const optionColors = ['bg-red-600', 'bg-blue-600', 'bg-yellow-600', 'bg-green-600'];
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">
            Câu {questionIndex + 1}/{question.totalQuestions}
          </span>
          <span className={`text-3xl font-bold font-mono ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
            {timeLeft}s
          </span>
          <span className="text-sm text-green-400 font-medium">{totalScore} đ</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-lg text-white font-medium leading-relaxed">{question.content}</p>
        </div>

        {question.options && (
          <div className="grid grid-cols-1 gap-3">
            {question.options.map((o, i) => {
              const isSelected = selectedAnswer === o.id;
              const showResult = answerResult && isSelected;
              let bgClass = optionColors[i] ?? 'bg-slate-600';
              if (showResult) {
                bgClass = answerResult.isCorrect ? 'bg-green-600 ring-2 ring-green-400' : 'bg-red-700 ring-2 ring-red-400';
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

        {answerResult && (
          <div className={`flex items-center justify-center gap-2 text-lg font-bold ${
            answerResult.isCorrect ? 'text-green-400' : 'text-red-400'
          }`}>
            {answerResult.isCorrect
              ? <><CheckCircle size={24} /> Đúng! +{answerResult.score} điểm</>
              : <><XCircle size={24} /> Sai rồi</>
            }
          </div>
        )}

        {selectedAnswer && !answerResult && (
          <p className="text-center text-sm text-slate-400 animate-pulse">Đang chấm...</p>
        )}

        {timeLeft === 0 && !selectedAnswer && (
          <p className="text-center text-red-400 font-medium">Hết giờ!</p>
        )}
      </div>
    );
  }

  // WAITING FOR NEXT QUESTION (after result shown)
  if (phase === 'result') {
    return (
      <div className="max-w-md mx-auto px-4 py-8 space-y-6 text-center">
        {answerResult && (
          <div className={`text-3xl font-bold ${answerResult.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
            {answerResult.isCorrect ? `+${answerResult.score} điểm` : 'Sai rồi'}
          </div>
        )}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-sm text-slate-400 mb-1">Tổng điểm</p>
          <p className="text-4xl font-bold text-white">{totalScore}</p>
        </div>

        {leaderboard.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <h3 className="text-sm text-slate-400">Bảng xếp hạng</h3>
            {leaderboard.slice(0, 5).map((entry, i) => {
              const isMe = entry.user_id === userId;
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center justify-between py-1.5 px-2 rounded ${isMe ? 'bg-cyan-900/30 border border-cyan-500/20' : ''}`}
                >
                  <span className="text-white text-sm">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}{' '}
                    {entry.display_name} {isMe && <span className="text-cyan-400 text-xs">(bạn)</span>}
                  </span>
                  <span className="text-green-400 font-bold text-sm">{entry.total_score}</span>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-sm text-slate-400 animate-pulse">Đang chờ câu tiếp theo...</p>
      </div>
    );
  }

  // GAME FINISHED
  if (phase === 'finished') {
    const myRank = leaderboard.findIndex((e) => e.user_id === userId) + 1;
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-6">
        <Trophy className="w-16 h-16 mx-auto text-yellow-400" />
        <h1 className="text-3xl font-bold">Trò chơi kết thúc!</h1>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <p className="text-sm text-slate-400">Tổng điểm của bạn</p>
          <p className="text-4xl font-bold text-green-400">{totalScore}</p>
          {myRank > 0 && (
            <p className="text-sm text-cyan-400">Xếp hạng: #{myRank}/{leaderboard.length}</p>
          )}
        </div>

        {leaderboard.length > 0 && (
          <div className="space-y-2">
            {leaderboard.map((entry, i) => {
              const isMe = entry.user_id === userId;
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isMe
                      ? 'bg-cyan-900/30 border border-cyan-500/30'
                      : i === 0
                        ? 'bg-yellow-900/20 border border-yellow-500/20'
                        : 'bg-slate-900 border border-slate-800'
                  }`}
                >
                  <span className="text-white font-medium text-sm">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}{' '}
                    {entry.display_name} {isMe && <span className="text-cyan-400 text-xs">(bạn)</span>}
                  </span>
                  <span className="text-green-400 font-bold">{entry.total_score} đ</span>
                </div>
              );
            })}
          </div>
        )}

        <a
          href="/student"
          className="inline-block rounded-lg bg-slate-700 hover:bg-slate-600 px-6 py-3 text-sm text-white min-h-[44px]"
        >
          Quay lại thành phố
        </a>
      </div>
    );
  }

  return null;
}
