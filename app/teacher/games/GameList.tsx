'use client';

import Link from 'next/link';
import type { GameRow } from '@/services/games';
import { useLocale } from '@/components/i18n/LocaleProvider';

export function GameList({ games }: { games: GameRow[] }) {
  const { t } = useLocale();
  const MODE_LABELS: Record<string, string> = { tu_luyen: t('gm.modeSelf'), thi_dau: t('gm.modeLive') };
  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    draft: { label: t('as.draft'), color: 'text-slate-400' },
    ready: { label: t('gm.statusReady'), color: 'text-green-400' },
    live: { label: t('gm.statusLive'), color: 'text-yellow-400' },
    finished: { label: t('gm.statusFinished'), color: 'text-slate-500' },
  };

  if (games.length === 0) {
    return <p className="text-center text-slate-500 py-8">{t('gm.emptyList')}</p>;
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
              <span>{g.question_count ?? 0} {t('gm.qShort')}</span>
              <span>{g.time_per_question}s/{t('gm.perQ')}</span>
              {g.shuffle_questions && <span>{t('gm.shuffled')}</span>}
              {g.level_progression && <span>{t('gm.levelUp')}</span>}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
