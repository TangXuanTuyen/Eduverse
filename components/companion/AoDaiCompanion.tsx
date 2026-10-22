'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { VinaSpriteCSS } from './VinaSpriteCSS';
import { CompanionChat } from './CompanionChat';

export function AoDaiCompanion() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const reducedMotion = useReducedMotion();
  const router = useRouter();

  const handleOpenFull = useCallback(() => {
    setOpen(false);
    router.push('/student/tutor');
  }, [router]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    },
    [open]
  );

  if (hidden) {
    return (
      <button
        onClick={() => setHidden(false)}
        className="fixed bottom-4 right-4 z-50 min-h-[44px] min-w-[44px] bg-slate-800/80 text-amber-400 rounded-full flex items-center justify-center border border-slate-600 hover:bg-slate-700"
        aria-label="Hiện Vina"
      >
        💬
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2"
      onKeyDown={handleKeyDown}
    >
      {open && (
        <CompanionChat onClose={() => setOpen(false)} onOpenFullPage={handleOpenFull} />
      )}

      {!open && (
        <div className="bg-slate-800/90 border border-amber-500/40 rounded-xl px-3 py-2 text-sm text-amber-200 shadow-lg max-w-[200px] animate-fade-in">
          Chào bạn! Vina AI sẵn sàng hỗ trợ bạn 🌟
        </div>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => setHidden(true)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-300 text-xs"
          aria-label="Ẩn Vina"
          title="Ẩn"
        >
          ✕
        </button>
        <button
          onClick={() => setOpen((v) => !v)}
          className="min-h-[48px] min-w-[48px] rounded-full bg-slate-800/90 border-2 border-amber-500/60 hover:border-amber-400 shadow-lg transition-colors flex items-center justify-center"
          aria-label={open ? 'Đóng trò chuyện với Vina' : 'Mở trò chuyện với Vina'}
          aria-expanded={open}
        >
          <VinaSpriteCSS state={open ? 'typing' : 'ready'} reducedMotion={reducedMotion} />
        </button>
      </div>
    </div>
  );
}
