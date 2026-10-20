'use client';

import Link from 'next/link';
import type { GameRow } from '@/services/games';

const MODE_LABELS: Record<string, string> = { tu_luyen: 'Tự luyện', thi_dau: 'Thi đấu' };
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Nháp', color: 'text-slate-400' },
  ready: { label: 'Sẵn sàng', color: 'text-green-400' },
  live: { label: 'Đang chơi', color: 'text-yellow-400' },
  finished: { label: 'Đã kết thúc', color: 'text-slate-500' },
};

export function GameList({ games }: { games: GameRow[] }) {
  if (games.length === 0) {
    return <p className="text-center text-slate-500 py-8">Chưa có trò chơi. Bấm &quot;Tạo trò chơi&quot; để bắt đầu.</p>;
  }

  return (
    <div className="space-y-2">
      {games.map((g) => {
        const st = STATUS_LABELS[g.status] ?? STATUS_LABELS.draft;
        return (
          <Link
            key={g.id}
            href={`/teacher/games/${g.id}`}
            className="block bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-white truncate">{g.name}</h3>
              <span className={`text-xs font-medium ${st.color}`}>{st.label}</span>
            </div>
            <div className="flex gap-3 mt-1 text-xs text-slate-400">
              <span>{MODE_LABELS[g.mode] ?? g.mode}</span>
              <span>{g.question_count ?? 0} câu</span>
              <span>{g.time_per_question}s/câu</span>
              {g.shuffle_questions && <span>Trộn đề</span>}
              {g.level_progression && <span>Vượt ải</span>}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
