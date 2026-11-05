'use client';

import { useActionState, useState, useEffect } from 'react';
import { createGameAction, type GameActionState } from './actions';
import { useLocale } from '@/components/i18n/LocaleProvider';

type QuestionSet = { id: string; name: string; question_count: number };

export function CreateGameButton() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<GameActionState, FormData>(createGameAction, {});
  const [sets, setSets] = useState<QuestionSet[]>([]);

  useEffect(() => {
    if (!open) return;
    fetch('/api/teacher/sets').then((r) => r.json()).then((d) => setSets(d.sets ?? [])).catch(() => {});
  }, [open]);

  if (state.success && open) {
    setTimeout(() => setOpen(false), 0);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-green-600 hover:bg-green-500 px-4 py-2 text-sm font-medium text-white min-h-[44px]"
      >
        {t('gm.create')}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
      <form action={formAction} className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-white">{t('gm.createTitle')}</h3>
        {state.error && <p className="text-red-400 text-sm">{state.error}</p>}

        <label className="block">
          <span className="text-xs text-slate-400">{t('gm.name')}</span>
          <input name="name" type="text" required placeholder={t('gm.namePlaceholder')} className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white" />
        </label>

        <div>
          <span className="text-xs text-slate-400">{t('gm.chooseSet')}</span>
          <div className="mt-1 space-y-2 max-h-40 overflow-y-auto">
            {sets.length === 0 && <p className="text-xs text-slate-500 p-2">{t('gm.noSet')}</p>}
            {sets.map((s) => (
              <label key={s.id} className="flex items-center gap-3 p-3 rounded-lg border bg-slate-800 border-slate-700 hover:border-slate-600 cursor-pointer has-[:checked]:border-green-500 has-[:checked]:bg-green-900/20">
                <input type="radio" name="question_set_id" value={s.id} required className="accent-green-500" />
                <div>
                  <p className="text-sm text-white">{s.name}</p>
                  <p className="text-xs text-slate-400">{s.question_count} {t('gm.qShort')}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-slate-400">{t('gm.mode')}</span>
            <select name="mode" className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white">
              <option value="thi_dau">{t('gm.modeLiveOpt')}</option>
              <option value="tu_luyen">{t('gm.modeSelfOpt')}</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">{t('gm.timePerQ')}</span>
            <input name="time_per_question" type="number" min={5} max={120} defaultValue={30} className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-slate-400">{t('gm.pointsPerQ')}</span>
            <input name="points_per_question" type="number" min={1} max={1000} defaultValue={100} className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white" />
          </label>
          <div className="space-y-2 pt-5">
            <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
              <input type="checkbox" name="shuffle_questions" value="true" className="accent-green-500" />
              {t('gm.shuffleQ')}
            </label>
            <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
              <input type="checkbox" name="shuffle_options" value="true" className="accent-green-500" />
              {t('gm.shuffleOpt')}
            </label>
            <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
              <input type="checkbox" name="level_progression" value="true" className="accent-green-500" />
              {t('gm.levelProg')}
            </label>
          </div>
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={pending} className="rounded-lg bg-green-600 hover:bg-green-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 min-h-[44px]">
            {pending ? t('gm.creating') : t('gm.create')}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]">
            {t('cs.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
