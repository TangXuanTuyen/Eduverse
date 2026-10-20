'use client';

import { useActionState } from 'react';
import { DoorOpen } from 'lucide-react';
import { joinRoomAction, type JoinRoomState } from './actions';

export function JoinRoomForm() {
  const [state, formAction, pending] = useActionState<JoinRoomState, FormData>(joinRoomAction, {});

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div>
        <label htmlFor="code" className="block text-sm font-semibold text-slate-200 mb-1.5">
          Mã phòng
        </label>
        <input
          id="code"
          name="code"
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          spellCheck={false}
          autoFocus
          required
          maxLength={8}
          className="w-full min-h-12 px-4 rounded-xl bg-slate-800 border border-slate-600 text-white text-center text-2xl font-mono tracking-[0.3em] uppercase placeholder:text-slate-500 focus:border-indigo-400"
          placeholder="ABCDEF"
        />
        <p className="mt-1 text-xs text-slate-400">
          Hỏi thầy cô lấy mã 6 ký tự để vào phòng học.
        </p>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-rose-200 bg-rose-950/60 border border-rose-800 rounded-xl px-3 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full min-h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold flex items-center justify-center gap-2"
      >
        <DoorOpen className="w-5 h-5" aria-hidden="true" />
        {pending ? 'Đang vào phòng…' : 'Vào phòng'}
      </button>
    </form>
  );
}
