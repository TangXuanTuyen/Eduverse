'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { startSessionAction, deleteGameAction } from '../actions';
import type { GameRow, GameQuestionRow } from '@/services/games';

const MODE_LABELS: Record<string, string> = { tu_luyen: 'Tự luyện', thi_dau: 'Thi đấu' };

type Props = {
  game: GameRow;
  questions: Omit<GameQuestionRow, 'correct_answer'>[];
};

export function GameDetail({ game, questions }: Props) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleStart() {
    setStarting(true);
    const result = await startSessionAction(game.id);
    if ('error' in result && result.error) {
      alert(result.error);
      setStarting(false);
      return;
    }
    if ('sessionId' in result) {
      router.push(`/teacher/games/${game.id}/play?session=${result.sessionId}`);
    }
  }

  async function handleDelete() {
    if (!confirm('Xóa trò chơi này?')) return;
    setDeleting(true);
    const result = await deleteGameAction(game.id);
    if (result.error) {
      alert(result.error);
      setDeleting(false);
      return;
    }
    router.push('/teacher/games');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">{game.name}</h1>
        <div className="flex gap-2">
          <button
            onClick={handleStart}
            disabled={starting}
            className="rounded-lg bg-green-600 hover:bg-green-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 min-h-[44px]"
          >
            {starting ? 'Đang tạo phiên...' : 'Bắt đầu chơi'}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg bg-red-700 hover:bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50 min-h-[44px]"
          >
            Xóa
          </button>
        </div>
      </div>

      <div className="flex gap-4 text-sm text-slate-400">
        <span>Chế độ: <span className="text-white">{MODE_LABELS[game.mode]}</span></span>
        <span>{game.time_per_question}s/câu</span>
        <span>{game.points_per_question} điểm/câu</span>
        {game.shuffle_questions && <span className="text-cyan-400">Trộn đề</span>}
        {game.level_progression && <span className="text-yellow-400">Vượt ải</span>}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-slate-300">{questions.length} câu hỏi</h2>
        {questions.map((q, i) => (
          <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3">
            <p className="text-sm text-white">{i + 1}. {q.content}</p>
            {q.options && (
              <div className="mt-1 space-y-0.5">
                {q.options.map((o) => (
                  <p key={o.id} className="text-xs text-slate-400">
                    <span className="font-mono">{o.id.toUpperCase()}.</span> {o.text}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
