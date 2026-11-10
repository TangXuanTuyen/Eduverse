'use client';

import { useCallback, useEffect, useState } from 'react';
import { DialogFrame } from '@/components/ui/DialogFrame';

type Invite = { matchId: string; hostName: string; assignmentTitle: string };

const POLL_MS = 8000;

/** Nhận lời mời "đấu cùng bạn" từ bạn cùng lớp và hiện hộp thoại Chấp nhận / Từ chối. */
export function DuelInviteWatcher() {
  const [invite, setInvite] = useState<Invite | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dismissed, setDismissed] = useState<string[]>([]);

  const poll = useCallback(async () => {
    if (document.hidden) return;
    try {
      const res = await fetch('/api/duel/inbox', { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as { invites: Invite[] };
      const next = (data.invites ?? []).find((i) => !dismissed.includes(i.matchId)) ?? null;
      setInvite((cur) => (cur && next && cur.matchId === next.matchId ? cur : next));
    } catch {
      /* mạng yếu: thử lại lượt sau */
    }
  }, [dismissed]);

  useEffect(() => {
    poll();
    const t = setInterval(poll, POLL_MS);
    return () => clearInterval(t);
  }, [poll]);

  async function respond(accept: boolean) {
    if (!invite) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/duel/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: invite.matchId, accept }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Không phản hồi được lời mời');
        setDismissed((d) => [...d, invite.matchId]);
        setBusy(false);
        return;
      }
      if (accept) {
        window.location.href = `/games/dau-truong-anh-sang/index.html?duel=${invite.matchId}`;
        return;
      }
      setDismissed((d) => [...d, invite.matchId]);
      setInvite(null);
    } catch {
      setError('Mạng chưa ổn, em thử lại nhé');
    }
    setBusy(false);
  }

  if (!invite) return null;

  return (
    <DialogFrame
      onClose={() => respond(false)}
      label="Lời mời đấu"
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/80"
    >
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-cyan-500/40 p-5 text-white space-y-4 shadow-2xl">
        <h2 className="text-lg font-bold">⚔️ Lời mời đấu</h2>
        <p className="text-sm text-slate-200">
          <strong>{invite.hostName}</strong> mời em đấu <strong>Đấu Trường Ánh Sáng</strong> ở bài giao “{invite.assignmentTitle}”.
        </p>
        {error && <p role="alert" className="text-sm text-amber-300">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => respond(true)}
            className="flex-1 min-h-11 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold disabled:opacity-60"
          >
            Chấp nhận
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => respond(false)}
            className="flex-1 min-h-11 rounded-xl bg-slate-700 hover:bg-slate-600 font-semibold disabled:opacity-60"
          >
            Từ chối
          </button>
        </div>
      </div>
    </DialogFrame>
  );
}
