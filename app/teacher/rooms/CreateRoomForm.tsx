'use client';

import { useActionState, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { createRoomAction, type RoomActionState } from './actions';
import { useLocale } from '@/components/i18n/LocaleProvider';

export function CreateRoomForm() {
  const { t } = useLocale();
  const [state, formAction, pending] = useActionState<RoomActionState, FormData>(createRoomAction, {});
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full min-h-14 rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-400/50 text-slate-400 hover:text-indigo-300 font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:bg-indigo-500/5 group"
      >
        <div className="w-8 h-8 rounded-xl bg-slate-800 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
          <Plus className="w-5 h-5" />
        </div>
        {t('rooms.create')}
      </button>
    );
  }

  return (
    <form action={formAction} className="bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-700/50 rounded-2xl p-5 space-y-4 shadow-xl shadow-black/20">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">{t('rooms.newTitle')}</h3>
        <button type="button" onClick={() => setOpen(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div>
        <label htmlFor="room-name" className="block text-sm font-medium text-slate-300 mb-1.5">{t('rooms.name')}</label>
        <input id="room-name" name="name" required className="w-full min-h-11 px-4 rounded-xl bg-slate-800/80 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all" placeholder="KHTN 6A1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="room-subject" className="block text-sm text-slate-400 mb-1.5">{t('rooms.subject')}</label>
          <input id="room-subject" name="subject" className="w-full min-h-11 px-4 rounded-xl bg-slate-800/80 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all" placeholder="KHTN" />
        </div>
        <div>
          <label htmlFor="room-grade" className="block text-sm text-slate-400 mb-1.5">{t('rooms.grade')}</label>
          <select id="room-grade" name="grade" className="w-full min-h-11 px-4 rounded-xl bg-slate-800/80 border border-slate-700/50 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all">
            <option value="">--</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
          </select>
        </div>
      </div>

      {state.error && <p role="alert" className="text-sm text-rose-300 bg-rose-500/10 rounded-lg px-3 py-2">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-300 bg-emerald-500/10 rounded-lg px-3 py-2">{state.success}</p>}

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={pending} className="min-h-11 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 text-white font-semibold shadow-lg shadow-indigo-500/20 transition-all">
          {pending ? t('rooms.submitting') : t('rooms.submit')}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="min-h-11 px-4 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
          {t('rooms.cancel')}
        </button>
      </div>
    </form>
  );
}
