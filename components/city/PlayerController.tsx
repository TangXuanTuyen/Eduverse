/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Compass, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useLocale } from '@/components/i18n/LocaleProvider';

interface PlayerControllerProps {
  onMoveInput: (dx: number, dy: number) => void;
  onInteract: () => void;
  onOpenQuickTravel: () => void;
  hasNearbyBuilding: boolean;
}

export const PlayerController: React.FC<PlayerControllerProps> = ({
  onMoveInput,
  onInteract,
  onOpenQuickTravel,
  hasNearbyBuilding,
}) => {
  const activeDirRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [pressedBtn, setPressedBtn] = useState<string | null>(null);
  const [isDpadHidden, setIsDpadHidden] = useState(false);
  const { t } = useLocale();

  const startMoving = (dir: 'up' | 'down' | 'left' | 'right') => {
    setPressedBtn(dir);
    let dx = 0;
    let dy = 0;
    if (dir === 'up') dy = -1;
    if (dir === 'down') dy = 1;
    if (dir === 'left') dx = -1;
    if (dir === 'right') dx = 1;
    activeDirRef.current = { dx, dy };
    onMoveInput(dx, dy);
  };

  const stopMoving = () => {
    setPressedBtn(null);
    activeDirRef.current = { dx: 0, dy: 0 };
    onMoveInput(0, 0);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      if (activeDirRef.current.dx !== 0 || activeDirRef.current.dy !== 0) {
        stopMoving();
      }
    };
    window.addEventListener('pointerup', handleMouseUp);
    window.addEventListener('pointercancel', handleMouseUp);
    return () => {
      window.removeEventListener('pointerup', handleMouseUp);
      window.removeEventListener('pointercancel', handleMouseUp);
    };
  }, []);

  return (
    <>
      {/* VIRTUAL TOUCH D-PAD (Bottom Left, 30% more compact, subtle & non-intrusive) */}
      <div className="absolute bottom-4 left-4 z-20 select-none flex items-end gap-1.5">
        {!isDpadHidden ? (
          <div className="relative w-36 h-36 bg-slate-900/40 hover:bg-slate-900/70 backdrop-blur-sm rounded-full border border-slate-700/50 shadow-lg p-1.5 flex items-center justify-center opacity-65 hover:opacity-100 transition-all duration-200">
            {/* UP */}
            <button
              type="button"
              aria-label={t('pc.up')}
              onPointerDown={(e) => {
                e.preventDefault();
                startMoving('up');
              }}
              className={`absolute top-1 w-11 h-11 rounded-lg flex items-center justify-center transition active:scale-95 cursor-pointer ${
                pressedBtn === 'up'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/90'
              }`}
            >
              <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* DOWN */}
            <button
              type="button"
              aria-label={t('pc.down')}
              onPointerDown={(e) => {
                e.preventDefault();
                startMoving('down');
              }}
              className={`absolute bottom-1 w-11 h-11 rounded-lg flex items-center justify-center transition active:scale-95 cursor-pointer ${
                pressedBtn === 'down'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/90'
              }`}
            >
              <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* LEFT */}
            <button
              type="button"
              aria-label={t('pc.left')}
              onPointerDown={(e) => {
                e.preventDefault();
                startMoving('left');
              }}
              className={`absolute left-1 w-11 h-11 rounded-lg flex items-center justify-center transition active:scale-95 cursor-pointer ${
                pressedBtn === 'left'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/90'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* RIGHT */}
            <button
              type="button"
              aria-label={t('pc.right')}
              onPointerDown={(e) => {
                e.preventDefault();
                startMoving('right');
              }}
              className={`absolute right-1 w-11 h-11 rounded-lg flex items-center justify-center transition active:scale-95 cursor-pointer ${
                pressedBtn === 'right'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/90'
              }`}
            >
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Center Compass Rose */}
            <div className="w-5 h-5 rounded-full bg-slate-950/60 flex items-center justify-center text-indigo-400">
              <Compass className="w-3 h-3" />
            </div>
          </div>
        ) : null}

        {/* Toggle D-pad visibility button */}
        <button
          type="button"
          aria-label={isDpadHidden ? t('pc.showPad') : t('pc.hidePad')}
          onClick={() => setIsDpadHidden(!isDpadHidden)}
          className="min-w-11 min-h-11 flex items-center justify-center rounded-lg bg-slate-900/50 hover:bg-slate-900/80 border border-slate-700/50 text-slate-400 hover:text-white transition backdrop-blur-sm cursor-pointer"
          title={isDpadHidden ? t('pc.showPadTitle') : t('pc.hidePadTitle')}
        >
          {isDpadHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>

      {/* QUICK FLOATING ACTIONS (Bottom Right) */}
      <div className="absolute bottom-5 right-5 z-20 flex flex-col gap-2.5">
        {/* INTERACT BUTTON */}
        {hasNearbyBuilding && (
          <button
            type="button"
            aria-label={t('pc.interact')}
            onClick={onInteract}
            className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/30 flex flex-col items-center justify-center border-2 border-yellow-200 transition transform hover:scale-105 active:scale-95 cursor-pointer motion-safe:animate-pulse"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[9px] uppercase font-bold tracking-tight">{t('pc.enter')}</span>
          </button>
        )}

        {/* FAST TRAVEL BUTTON */}
        <button
          type="button"
          aria-label={t('pc.quickTravelAria')}
          onClick={onOpenQuickTravel}
          className="w-11 h-11 bg-slate-900/80 hover:bg-slate-900 border border-slate-700/80 text-slate-200 rounded-xl shadow-lg backdrop-blur flex items-center justify-center transition hover:text-white cursor-pointer"
          title={t('pc.quickTravelTitle')}
        >
          <Compass className="w-5 h-5 text-indigo-400" />
        </button>
      </div>
    </>
  );
};
