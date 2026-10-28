'use client';

import { useState, useEffect, useCallback } from 'react';
import { advanceQuestionAction, endSessionAction } from '../../actions';
import { createClient } from '@/lib/supabase/client';
import { useLocale } from '@/components/i18n/LocaleProvider';

type Player = { display_name: string; total_score: number };
type QuestionData = {
  id: string;
  content: string;
  options: { id: string; text: string }[] | null;
  type: string;
  points: number;
};
type QuestionResult = {
  correctAnswer: unknown;
  explanation: string;
  total: number;
  correct: number;
  accuracy: number;
};

type Props = { gameId: string; sessionId: string };

export function GameControlPanel({ gameId, sessionId }: Props) {
  const { t } = useLocale();
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [questionIndex, setQuestionIndex] = useState(-1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeLimit, setTimeLimit] = useState(30);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [questionResult, setQuestionResult] = useState<QuestionResult | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [gameEnded, setGameEnded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetch(`/api/game/${sessionId}/info`)
      .then((r) => r.json())
      .then((d) => {
        setJoinCode(d.joinCode ?? '');
        setPlayers(d.players ?? []);
        setTotalQuestions(d.totalQuestions ?? 0);
      })
      .catch(() => {});
  }, [sessionId]);

  // Subscribe to Realtime for player count updates
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`game:${sessionId}`);

    channel.on('broadcast', { event: 'player_joined' }, (payload: { payload: Player }) => {
      setPlayers((prev) => [...prev, payload.payload]);
    });

    channel.on('broadcast', { event: 'answer_received' }, (payload: { payload: { count: number } }) => {
      setAnsweredCount(payload.payload.count);
    });

    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || !currentQuestion) return;
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, currentQuestion]);

  const handleNextQuestion = useCallback(async () => {
    setLoading(true);
    setQuestionResult(null);
    setAnsweredCount(0);

    const result = await advanceQuestionAction(sessionId);
    setLoading(false);

    if ('error' in result && result.error) {
      alert(result.error);
      return;
    }

    if ('finished' in result && result.finished) {
      setGameEnded(true);
      return;
    }

    if ('question' in result && result.question) {
      const q = result.question as QuestionData;
      setCurrentQuestion(q);
      setQuestionIndex(result.questionIndex as number);
      setTotalQuestions(result.totalQuestions as number);
      setTimeLimit(result.timeLimit as number);
      setTimeLeft(result.timeLimit as number);
    }
  }, [sessionId]);

  const handleShowResults = useCallback(async () => {
    const res = await fetch(`/api/game/${sessionId}/results?questionId=${currentQuestion?.id}`);
    const data = await res.json();
    setQuestionResult(data);
    // Refresh players for updated scores
    const pRes = await fetch(`/api/game/${sessionId}/info`);
    const pData = await pRes.json();
    setPlayers(pData.players ?? []);
  }, [sessionId, currentQuestion]);

  const handleEnd = useCallback(async () => {
    if (!confirm(t('gm.endConfirm'))) return;
    await endSessionAction(sessionId);
    setGameEnded(true);
  }, [sessionId, t]);

  if (gameEnded) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-6">
        <h1 className="text-3xl font-bold">{t('gm.finished')}</h1>
        <div className="space-y-2">
          <h2 className="text-lg text-slate-300">{t('gm.leaderboard')}</h2>
          {players.sort((a, b) => b.total_score - a.total_score).map((p, i) => (
            <div key={p.display_name} className={`flex items-center justify-between p-3 rounded-lg ${i === 0 ? 'bg-yellow-900/30 border border-yellow-500/30' : 'bg-slate-900 border border-slate-800'}`}>
              <span className="text-white font-medium">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} {p.display_name}
              </span>
              <span className="text-green-400 font-bold">{p.total_score} {t('gm.pts')}</span>
            </div>
          ))}
        </div>
        <a href="/teacher/games" className="inline-block rounded-lg bg-slate-700 hover:bg-slate-600 px-6 py-3 text-sm text-white min-h-[44px]">
          {t('grading.back')}
        </a>
      </div>
    );
  }

  // Lobby - waiting for players
  if (questionIndex < 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-6">
        <h1 className="text-2xl font-bold">{t('gm.lobby')}</h1>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <p className="text-sm text-slate-400 mb-2">{t('gm.gameCode')}</p>
          <p className="text-5xl font-mono font-bold tracking-[0.3em] text-green-400">{joinCode}</p>
          <p className="text-xs text-slate-500 mt-2">{t('gm.joinHint')}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-sm text-slate-400 mb-2">{players.length} {t('gm.playersJoined')}</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {players.map((p) => (
              <span key={p.display_name} className="bg-slate-800 text-white text-sm px-3 py-1 rounded-full">{p.display_name}</span>
            ))}
          </div>
        </div>
        <button
          onClick={handleNextQuestion}
          disabled={loading || players.length === 0}
          className="rounded-lg bg-green-600 hover:bg-green-500 px-8 py-3 text-lg font-medium text-white disabled:opacity-50 min-h-[44px]"
        >
          {loading ? t('gm.starting') : t('gm.startBtn')}
        </button>
      </div>
    );
  }

  // Question display
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{t('grading.question')} {questionIndex + 1}/{totalQuestions}</span>
        <span className={`text-2xl font-bold font-mono ${timeLeft <= 5 ? 'text-red-400' : 'text-white'}`}>{timeLeft}s</span>
        <span className="text-sm text-slate-400">{answeredCount}/{players.length} {t('gm.answered')}</span>
      </div>

      {currentQuestion && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <p className="text-xl text-white font-medium">{currentQuestion.content}</p>
          {currentQuestion.options && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {currentQuestion.options.map((o, i) => {
                const colors = ['bg-red-600', 'bg-blue-600', 'bg-yellow-600', 'bg-green-600'];
                const isCorrect = questionResult && JSON.stringify(questionResult.correctAnswer) === JSON.stringify(o.id);
                return (
                  <div
                    key={o.id}
                    className={`p-4 rounded-lg text-white font-medium text-center ${
                      questionResult
                        ? isCorrect ? 'bg-green-600 ring-2 ring-green-400' : 'bg-slate-700 opacity-60'
                        : colors[i] ?? 'bg-slate-600'
                    }`}
                  >
                    <span className="font-mono mr-2">{o.id.toUpperCase()}.</span>{o.text}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {questionResult && (
        <div className="bg-slate-900 border border-green-500/30 rounded-xl p-4 space-y-2">
          <p className="text-green-400 font-medium">{t('gm.accuracy')}: {questionResult.accuracy}% ({questionResult.correct}/{questionResult.total})</p>
          {questionResult.explanation && <p className="text-sm text-slate-400 italic">{questionResult.explanation}</p>}
        </div>
      )}

      <div className="flex gap-3 justify-center">
        {!questionResult ? (
          <button
            onClick={handleShowResults}
            className="rounded-lg bg-blue-600 hover:bg-blue-500 px-6 py-3 text-sm font-medium text-white min-h-[44px]"
          >
            {t('gm.showAnswer')}
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            disabled={loading}
            className="rounded-lg bg-green-600 hover:bg-green-500 px-6 py-3 text-sm font-medium text-white disabled:opacity-50 min-h-[44px]"
          >
            {loading ? '...' : t('gm.nextQuestion')}
          </button>
        )}
        <button
          onClick={handleEnd}
          className="rounded-lg bg-red-700 hover:bg-red-600 px-6 py-3 text-sm text-white min-h-[44px]"
        >
          {t('gm.end')}
        </button>
      </div>

      {/* Mini leaderboard */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h3 className="text-sm text-slate-400 mb-2">Top 5</h3>
        {players.sort((a, b) => b.total_score - a.total_score).slice(0, 5).map((p, i) => (
          <div key={p.display_name} className="flex justify-between text-sm py-1">
            <span className="text-white">{i + 1}. {p.display_name}</span>
            <span className="text-green-400">{p.total_score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
