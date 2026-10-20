'use client';

import { useState, useCallback, useEffect } from 'react';
import { Swords, Heart, Zap, Shield, Trophy, Sparkles } from 'lucide-react';

type Question = {
  id: string;
  sourceQuestionId: string;
  type: string;
  content: string;
  options: { id: string; text: string }[] | null;
  fromReview: boolean;
  reviewId?: string;
};

type Phase = 'loading' | 'battle' | 'attack' | 'hit' | 'victory' | 'error';

export function BossBattle({
  onClose,
  skillTags,
  bossLabel,
}: {
  onClose: () => void;
  skillTags?: string[];
  bossLabel?: string;
}) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [sessionId, setSessionId] = useState('');
  const [bossName, setBossName] = useState(bossLabel || 'Boss');
  const [bossHp, setBossHp] = useState(0);
  const [bossMaxHp, setBossMaxHp] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalDamage, setTotalDamage] = useState(0);
  const [lastDamage, setLastDamage] = useState(0);
  const [isSpecial, setIsSpecial] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState('');
  const [victoryXp, setVictoryXp] = useState(0);
  const [newBadges, setNewBadges] = useState<Array<{ id: string; name: string; icon: string }>>([]);

  const startBoss = useCallback(async () => {
    setPhase('loading');
    try {
      const res = await fetch('/api/game/boss/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillTags, bossName: bossLabel }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setPhase('error'); return; }
      setSessionId(data.sessionId);
      setBossName(data.bossName);
      setBossHp(data.bossHp);
      setBossMaxHp(data.bossHp);
      setQuestions(data.questionIds);
      setCurrentIdx(0);
      setStreak(0);
      setTotalDamage(0);
      setPhase('battle');
    } catch {
      setError('Không thể tải trận đấu');
      setPhase('error');
    }
  }, [skillTags, bossLabel]);

  useEffect(() => { startBoss(); }, [startBoss]);

  const handleAnswer = async (optionId: string) => {
    if (phase !== 'battle') return;
    const q = questions[currentIdx];

    try {
      const res = await fetch('/api/game/boss/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceQuestionId: q.sourceQuestionId,
          answer: optionId,
          fromReview: q.fromReview,
          reviewId: q.reviewId,
        }),
      });
      const data = await res.json();

      if (data.isCorrect) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        const special = newStreak >= 3;
        const damage = special ? 150 : 100;
        setLastDamage(damage);
        setIsSpecial(special);
        setTotalDamage((d) => d + damage);
        const newHp = Math.max(0, bossHp - damage);
        setBossHp(newHp);
        setExplanation('');
        setPhase('attack');

        setTimeout(async () => {
          if (newHp <= 0) {
            // Victory!
            try {
              const compRes = await fetch('/api/game/boss/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
              });
              const compData = await compRes.json();
              setVictoryXp(compData.xpAwarded ?? 0);
              setNewBadges(compData.newBadges ?? []);
            } catch { /* ignore */ }
            setPhase('victory');
          } else if (currentIdx < questions.length - 1) {
            setCurrentIdx(currentIdx + 1);
            setPhase('battle');
          } else {
            setPhase('victory');
          }
        }, 800);
      } else {
        setStreak(0);
        setExplanation(data.explanation || '');
        setLastDamage(0);
        setIsSpecial(false);
        setPhase('hit');

        setTimeout(() => {
          if (currentIdx < questions.length - 1) {
            setCurrentIdx(currentIdx + 1);
            setPhase('battle');
          } else {
            setPhase('victory');
          }
        }, 2500);
      }
    } catch {
      setError('Lỗi kết nối');
      setPhase('error');
    }
  };

  const q = questions[currentIdx];
  const hpPercent = bossMaxHp > 0 ? (bossHp / bossMaxHp) * 100 : 100;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="w-5 h-5 text-red-400" />
          <span className="text-sm font-bold text-white">Đấu Trùm</span>
        </div>
        <span className="text-xs text-slate-400">
          {currentIdx + 1}/{questions.length}
        </span>
      </div>

      {/* Boss HP Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-red-400 font-bold">{bossName}</span>
          <span className="text-slate-400">{bossHp}/{bossMaxHp} HP</span>
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* Battle Arena */}
      <div className="relative h-32 bg-gradient-to-b from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-800 overflow-hidden flex items-end justify-between px-8">
        {/* Player */}
        <div className={`relative mb-4 transition-transform duration-300 ${phase === 'attack' ? 'translate-x-8 scale-110' : ''}`}>
          <div className="w-12 h-16 bg-cyan-600 rounded-t-lg relative pixel-character">
            <div className="absolute top-1 left-2 w-2 h-2 bg-white rounded-full" />
            <div className="absolute top-1 right-2 w-2 h-2 bg-white rounded-full" />
            <div className="absolute bottom-0 left-1 w-4 h-3 bg-cyan-700 rounded-b" />
          </div>
          {streak >= 3 && (
            <Zap className="absolute -top-3 -right-2 w-5 h-5 text-amber-400 animate-pulse" />
          )}
        </div>

        {/* Damage indicator */}
        {(phase === 'attack' || phase === 'hit') && lastDamage > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 animate-bounce">
            <span className={`text-lg font-black ${isSpecial ? 'text-amber-400' : 'text-red-400'}`}>
              {isSpecial ? '⚡' : '💥'} -{lastDamage}
            </span>
          </div>
        )}

        {phase === 'hit' && lastDamage === 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <Shield className="w-6 h-6 text-slate-500 animate-pulse" />
          </div>
        )}

        {/* Boss */}
        <div className={`relative mb-4 transition-transform duration-300 ${phase === 'hit' && lastDamage === 0 ? 'translate-x-[-8px]' : ''} ${phase === 'attack' ? 'scale-95' : ''}`}>
          <div className="w-16 h-20 bg-red-700 rounded-t-xl relative">
            <div className="absolute top-2 left-3 w-3 h-2 bg-amber-400 rounded-sm" />
            <div className="absolute top-2 right-3 w-3 h-2 bg-amber-400 rounded-sm" />
            <div className="absolute top-7 left-1/2 -translate-x-1/2 w-6 h-2 bg-red-900 rounded" />
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-3 bg-amber-600 rounded-t-lg" />
          </div>
        </div>
      </div>

      {/* Streak indicator */}
      {streak > 0 && phase === 'battle' && (
        <div className="text-center text-xs text-amber-400 font-bold">
          🔥 Chuỗi đúng: {streak} {streak >= 3 ? '— Chiêu đặc biệt!' : streak === 2 ? '— Còn 1 nữa!' : ''}
        </div>
      )}

      {/* Loading */}
      {phase === 'loading' && (
        <div className="text-center py-8 text-slate-400 animate-pulse">Đang chuẩn bị trận đấu...</div>
      )}

      {/* Error */}
      {phase === 'error' && (
        <div className="text-center py-8 space-y-3">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-800 text-sm text-white min-h-[44px]">Đóng</button>
        </div>
      )}

      {/* Question */}
      {phase === 'battle' && q && (
        <div className="space-y-3">
          {q.fromReview && (
            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">📝 Câu ôn tập</span>
          )}
          <p className="text-sm text-white font-medium">{q.content}</p>
          <div className="grid gap-2">
            {(q.options ?? []).map((opt: { id: string; text: string }) => (
              <button
                key={opt.id}
                onClick={() => handleAnswer(opt.id)}
                className="w-full text-left px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-red-500/50 text-sm text-slate-200 transition min-h-[44px]"
              >
                <span className="font-bold text-red-400 mr-2">{opt.id.toUpperCase()}.</span>
                {opt.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Wrong answer explanation */}
      {phase === 'hit' && explanation && (
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
          <p className="text-xs text-slate-300">💡 {explanation}</p>
        </div>
      )}

      {/* Victory */}
      {phase === 'victory' && (
        <div className="text-center space-y-4">
          <Trophy className="w-12 h-12 text-amber-400 mx-auto" />
          <div className="text-lg font-black text-white">
            {bossHp <= 0 ? `${bossName} đã bại!` : 'Hết câu hỏi!'}
          </div>
          <div className="text-sm text-slate-300">
            Sát thương tổng: <span className="text-red-400 font-bold">{totalDamage}</span>
          </div>

          {victoryXp > 0 && (
            <div className="bg-amber-500/10 rounded-xl p-3">
              <div className="text-amber-400 font-bold">+{victoryXp} XP</div>
            </div>
          )}

          {newBadges.length > 0 && (
            <div className="space-y-2">
              {newBadges.map((b) => (
                <div key={b.id} className="flex items-center justify-center gap-2 p-2 rounded-lg bg-amber-500/10">
                  <span className="text-lg">{b.icon}</span>
                  <span className="text-xs text-white font-medium">{b.name}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={startBoss} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-sm text-white font-medium min-h-[44px]">
              Đấu lại
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
