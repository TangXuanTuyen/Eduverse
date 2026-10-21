'use client';

import { useActionState } from 'react';
import { Copy, RefreshCw, Users, Check, Clock, Hash } from 'lucide-react';
import { refreshCodeAction, type RoomActionState } from './actions';
import { useState } from 'react';

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

const GRADIENTS = [
  'from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/15 hover:to-purple-500/15',
  'from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/15 hover:to-teal-500/15',
  'from-amber-500/10 to-orange-500/10 hover:from-amber-500/15 hover:to-orange-500/15',
  'from-rose-500/10 to-pink-500/10 hover:from-rose-500/15 hover:to-pink-500/15',
  'from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/15 hover:to-blue-500/15',
];

const ACCENT_COLORS = [
  { border: 'border-indigo-500/20', text: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { border: 'border-emerald-500/20', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { border: 'border-amber-500/20', text: 'text-amber-400', bg: 'bg-amber-500/10' },
  { border: 'border-rose-500/20', text: 'text-rose-400', bg: 'bg-rose-500/10' },
  { border: 'border-cyan-500/20', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
];

function hashIndex(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h) % GRADIENTS.length;
}

export function RoomCard({ room }: { room: Room }) {
  const [state, formAction, pending] = useActionState<RoomActionState, FormData>(refreshCodeAction, {});
  const code = state.success?.match(/:\s*(\S+)/)?.[1] ?? room.join_code;
  const expired = room.join_code_expires_at ? new Date(room.join_code_expires_at) < new Date() : false;
  const [copied, setCopied] = useState(false);
  const idx = hashIndex(room.id);
  const gradient = GRADIENTS[idx];
  const accent = ACCENT_COLORS[idx];

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-gradient-to-br ${gradient} border ${accent.border} rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-black/20`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-bold text-lg text-white truncate">{room.name}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {room.subject && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${accent.bg} ${accent.text}`}>
                <BookIcon className="w-3 h-3" />
                {room.subject}
              </span>
            )}
            {room.grade && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800/60 text-slate-300">
                Khối {room.grade}
              </span>
            )}
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl ${accent.bg}`}>
          <Users className={`w-4 h-4 ${accent.text}`} />
          <span className={`text-sm font-bold ${accent.text}`}>{room.memberCount}</span>
        </div>
      </div>

      {code && (
        <div className="mt-4 flex items-center gap-2 bg-black/20 rounded-xl px-4 py-2.5">
          <Hash className="w-4 h-4 text-slate-500" />
          <span className="text-xl font-mono font-bold tracking-[0.25em] text-white flex-1">{code}</span>
          <button
            onClick={handleCopy}
            className={`p-2 rounded-lg transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
              copied ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="Sao chép mã"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <form action={formAction} className="inline">
            <input type="hidden" name="roomId" value={room.id} />
            <button
              type="submit"
              disabled={pending}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-60 min-h-[44px] min-w-[44px] flex items-center justify-center transition-all"
              title="Đổi mã mới"
            >
              <RefreshCw className={`w-4 h-4 ${pending ? 'animate-spin' : ''}`} />
            </button>
          </form>
          {expired && (
            <span className="flex items-center gap-1 text-xs text-amber-400 font-medium">
              <Clock className="w-3 h-3" /> Hết hạn
            </span>
          )}
        </div>
      )}

      {state.error && <p className="mt-3 text-sm text-rose-300 bg-rose-500/10 rounded-lg px-3 py-2">{state.error}</p>}
    </div>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811V2.828zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492V2.687zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783z"/>
    </svg>
  );
}
