'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { startSessionAction, deleteGameAction, assignGameAction } from '../actions';
import type { GameRow, GameQuestionRow } from '@/services/games';
import { useLocale } from '@/components/i18n/LocaleProvider';

type Props = {
  game: GameRow;
  questions: Omit<GameQuestionRow, 'correct_answer'>[];
};

type Room = { id: string; name: string };

export function GameDetail({ game, questions }: Props) {
  const router = useRouter();
  const { t } = useLocale();
  const MODE_LABELS: Record<string, string> = { tu_luyen: t('gm.modeSelf'), thi_dau: t('gm.modeLive') };
  const [starting, setStarting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState('');
  const [assignOk, setAssignOk] = useState(false);

  useEffect(() => {
    if (showAssign && rooms.length === 0) {
      fetch('/api/teacher/rooms')
        .then((r) => r.json())
        .then((d) => setRooms(Array.isArray(d) ? d : []))
        .catch(() => {});
    }
  }, [showAssign, rooms.length]);

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
    if (!confirm(t('gm.confirmDelete'))) return;
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
            {starting ? t('gm.startingSession') : t('gm.startPlay')}
          </button>
          <button
            onClick={() => setShowAssign(!showAssign)}
            className="rounded-lg bg-purple-600 hover:bg-purple-500 px-4 py-2 text-sm font-medium text-white min-h-[44px]"
          >
            {t('gm.assignExercise')}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg bg-red-700 hover:bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50 min-h-[44px]"
          >
            {t('qs.delete')}
          </button>
        </div>
      </div>

      <div className="flex gap-4 text-sm text-slate-400">
        <span>{t('gm.mode')}: <span className="text-white">{MODE_LABELS[game.mode]}</span></span>
        <span>{game.time_per_question}s/{t('gm.perQ')}</span>
        <span>{game.points_per_question} {t('gm.pointsPerQ').toLowerCase()}</span>
        {game.shuffle_questions && <span className="text-cyan-400">{t('gm.shuffled')}</span>}
        {game.level_progression && <span className="text-yellow-400">{t('gm.levelUp')}</span>}
      </div>

      {showAssign && (
        <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-purple-300">{t('gm.assignRoom')}</h3>
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white min-h-[44px]"
          >
            <option value="">{t('gm.chooseRoom')}</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (!selectedRoom) return;
                setAssigning(true);
                setAssignMsg('');
                const result = await assignGameAction(game.id, selectedRoom);
                setAssigning(false);
                if ('error' in result && result.error) {
                  setAssignOk(false);
                  setAssignMsg(result.error);
                } else {
                  setAssignOk(true);
                  setAssignMsg(t('gm.assigned'));
                  setSelectedRoom('');
                }
              }}
              disabled={!selectedRoom || assigning}
              className="rounded-lg bg-purple-600 hover:bg-purple-500 px-4 py-2 text-sm text-white disabled:opacity-50 min-h-[44px]"
            >
              {assigning ? '...' : t('gm.give')}
            </button>
            <button
              onClick={() => { setShowAssign(false); setAssignMsg(''); }}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-400 min-h-[44px]"
            >
              {t('cs.cancel')}
            </button>
          </div>
          {assignMsg && (
            <p className={`text-xs ${assignOk ? 'text-green-400' : 'text-red-400'}`}>
              {assignMsg}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-slate-300">{questions.length} {t('qs.unit')}</h2>
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
