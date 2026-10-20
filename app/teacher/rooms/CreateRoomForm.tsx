'use client';

import { useActionState, useState } from 'react';
import { Plus } from 'lucide-react';
import { createRoomAction, type RoomActionState } from './actions';

export function CreateRoomForm() {
  const [state, formAction, pending] = useActionState<RoomActionState, FormData>(createRoomAction, {});
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full min-h-12 rounded-xl border-2 border-dashed border-slate-600 hover:border-indigo-400 text-slate-300 hover:text-white font-semibold flex items-center justify-center gap-2 transition-colors"
      >
        <Plus className="w-5 h-5" /> Tạo phòng mới
      </button>
    );
  }

  return (
    <form action={formAction} className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
      <div>
        <label htmlFor="room-name" className="block text-sm font-semibold text-slate-200 mb-1">Tên phòng</label>
        <input id="room-name" name="name" required className="w-full min-h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white" placeholder="KHTN 6A1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="room-subject" className="block text-sm text-slate-300 mb-1">Môn học</label>
          <input id="room-subject" name="subject" className="w-full min-h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white" placeholder="KHTN" />
        </div>
        <div>
          <label htmlFor="room-grade" className="block text-sm text-slate-300 mb-1">Khối</label>
          <select id="room-grade" name="grade" className="w-full min-h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white">
            <option value="">--</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
          </select>
        </div>
      </div>

      {state.error && <p role="alert" className="text-sm text-rose-300">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-300">{state.success}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="min-h-10 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold">
          {pending ? 'Đang tạo…' : 'Tạo phòng'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="min-h-10 px-4 rounded-lg text-slate-400 hover:text-white">
          Hủy
        </button>
      </div>
    </form>
  );
}
