'use client';

import { useState, useEffect, useRef } from 'react';
import { Coffee, X } from 'lucide-react';

const BREAK_INTERVAL_MS = 20 * 60 * 1000; // 20 minutes

export function BreakReminder() {
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleReminder = () => {
    timerRef.current = setTimeout(() => setShow(true), BREAK_INTERVAL_MS);
  };

  useEffect(() => {
    scheduleReminder();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const dismiss = () => {
    setShow(false);
    scheduleReminder();
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] max-w-sm w-full px-4">
      <div className="bg-slate-800 border border-cyan-500/50 rounded-2xl p-4 shadow-xl shadow-cyan-950/30 flex items-start gap-3">
        <Coffee className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-bold text-white">Nghỉ giải lao nào!</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Em đã học 20 phút rồi. Hãy đứng dậy vận động, uống nước, rồi quay lại nhé!
          </p>
        </div>
        <button
          onClick={dismiss}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
