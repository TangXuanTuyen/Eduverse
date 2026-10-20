'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Play, Clock } from 'lucide-react';
import { SoloGameClient } from './SoloGameClient';

type Assignment = {
  id: string;
  game_id: string;
  game_name: string;
  question_count: number;
  time_per_question: number;
  due_at: string | null;
  mode: string;
};

type SoloState = {
  sessionId: string;
  question: Record<string, unknown> | null;
  totalQuestions: number;
  timePerQuestion: number;
};

export function GameAssignmentList() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [soloState, setSoloState] = useState<SoloState | null>(null);

  useEffect(() => {
    fetch('/api/game/assignments')
      .then((r) => r.json())
      .then((d) => setAssignments(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleStart(gameId: string) {
    setStarting(gameId);
    try {
      const res = await fetch('/api/game/solo/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      setSoloState({
        sessionId: data.sessionId,
        question: data.question,
        totalQuestions: data.totalQuestions,
        timePerQuestion: data.timePerQuestion,
      });
    } catch {
      alert('Lỗi kết nối');
    } finally {
      setStarting(null);
    }
  }

  if (soloState) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 overflow-auto">
        <SoloGameClient
          sessionId={soloState.sessionId}
          initialQuestion={soloState.question as never}
          totalQuestions={soloState.totalQuestions}
          timePerQuestion={soloState.timePerQuestion}
          onClose={() => setSoloState(null)}
        />
      </div>
    );
  }

  if (loading) return null;
  if (assignments.length === 0) return null;

  return (
    <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-emerald-400">
        <BookOpen size={20} />
        <span className="font-bold text-sm">Bài tập từ giáo viên</span>
      </div>
      <div className="space-y-2">
        {assignments.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between bg-slate-800/60 rounded-lg p-3"
          >
            <div className="space-y-0.5">
              <p className="text-sm text-white font-medium">{a.game_name}</p>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span>{a.question_count} câu</span>
                <span>·</span>
                <span><Clock size={10} className="inline" /> {a.time_per_question}s/câu</span>
                {a.due_at && (
                  <>
                    <span>·</span>
                    <span className="text-amber-400">
                      Hạn: {new Date(a.due_at).toLocaleDateString('vi-VN')}
                    </span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => handleStart(a.game_id)}
              disabled={starting === a.game_id}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs text-white font-medium flex items-center gap-1.5 min-h-[44px] disabled:opacity-50"
            >
              <Play size={14} />
              {starting === a.game_id ? '...' : 'Luyện'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
