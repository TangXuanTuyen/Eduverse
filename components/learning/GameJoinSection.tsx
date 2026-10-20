'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gamepad2 } from 'lucide-react';

export function GameJoinSection() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleJoin() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setError('Nhập mã trò chơi'); return; }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Lỗi tham gia');
        setLoading(false);
        return;
      }
      router.push(`/student/arcade/game/${data.sessionId}`);
    } catch {
      setError('Lỗi kết nối');
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-900/80 border border-cyan-500/30 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-cyan-400">
        <Gamepad2 size={20} />
        <span className="font-bold text-sm">Thi đấu trực tuyến</span>
      </div>
      <p className="text-xs text-slate-400">Nhập mã từ giáo viên để tham gia trò chơi</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          placeholder="VD: AB3CD5"
          maxLength={8}
          className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-center text-lg font-mono tracking-[0.2em] text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none min-h-[44px]"
        />
        <button
          onClick={handleJoin}
          disabled={loading || !code.trim()}
          className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 min-h-[44px]"
        >
          {loading ? '...' : 'Vào'}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
