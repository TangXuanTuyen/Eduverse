'use client';

import { useActionState } from 'react';
import { Copy, RefreshCw, Users } from 'lucide-react';
import { refreshCodeAction, type RoomActionState } from './actions';

type Room = {
  id: string;
  name: string;
  subject: string | null;
  grade: number | null;
  join_code: string | null;
  join_code_expires_at: string | null;
  is_active: boolean;
  memberCount: number;
};

export function RoomCard({ room }: { room: Room }) {
  const [state, formAction, pending] = useActionState<RoomActionState, FormData>(refreshCodeAction, {});
  const code = state.success?.match(/:\s*(\S+)/)?.[1] ?? room.join_code;
  const expired = room.join_code_expires_at ? new Date(room.join_code_expires_at) < new Date() : false;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-white">{room.name}</h2>
          <p className="text-xs text-slate-400">
            {room.subject && `${room.subject} · `}
            {room.grade && `Khối ${room.grade} · `}
            <Users className="w-3 h-3 inline" /> {room.memberCount} thành viên
          </p>
        </div>
      </div>

      {code && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-2xl font-mono font-bold tracking-[0.2em] text-indigo-300">{code}</span>
          <button
            onClick={() => navigator.clipboard.writeText(code)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            title="Sao chép mã"
          >
            <Copy className="w-4 h-4" />
          </button>
          <form action={formAction} className="inline">
            <input type="hidden" name="roomId" value={room.id} />
            <button
              type="submit"
              disabled={pending}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-60"
              title="Đổi mã mới"
            >
              <RefreshCw className={`w-4 h-4 ${pending ? 'animate-spin' : ''}`} />
            </button>
          </form>
          {expired && <span className="text-xs text-amber-400">Hết hạn</span>}
        </div>
      )}

      {state.error && <p className="mt-2 text-sm text-rose-300">{state.error}</p>}
    </div>
  );
}
