'use client';

import React from 'react';

type VinaState = 'ready' | 'typing' | 'sleeping';

export function VinaSpriteCSS({ state, reducedMotion }: { state: VinaState; reducedMotion: boolean }) {
  return (
    <div
      className="relative w-12 h-12 select-none"
      aria-hidden="true"
    >
      {/* Body — áo dài pixel art */}
      <svg viewBox="0 0 48 48" width={48} height={48} className="block">
        {/* Head */}
        <rect x={16} y={2} width={16} height={14} rx={2} fill="#FFD5B8" />
        {/* Eyes */}
        {state === 'sleeping' ? (
          <>
            <rect x={20} y={8} width={4} height={1} fill="#333" />
            <rect x={28} y={8} width={4} height={1} fill="#333" />
          </>
        ) : (
          <>
            <rect x={20} y={7} width={3} height={3} rx={1} fill="#333" />
            <rect x={28} y={7} width={3} height={3} rx={1} fill="#333" />
            <rect x={21} y={8} width={1} height={1} fill="#FFF" />
            <rect x={29} y={8} width={1} height={1} fill="#FFF" />
          </>
        )}
        {/* Smile */}
        <rect x={22} y={12} width={6} height={1} rx={0.5} fill="#E88" />
        {/* Hair */}
        <rect x={14} y={0} width={20} height={5} rx={2} fill="#2D1B00" />
        <rect x={14} y={3} width={3} height={10} fill="#2D1B00" />
        <rect x={31} y={3} width={3} height={10} fill="#2D1B00" />
        {/* Thân áo dài: loe nhẹ về gấu, cổ đứng, đường khuy giữa */}
        <polygon points="14,16 34,16 36,40 12,40" fill="#E63946" />
        <polygon points="20,16 28,16 24,21" fill="#FFD700" />
        <rect x={23} y={21} width={2} height={19} fill="#FFD700" />
        {/* Arms */}
        <rect x={10} y={18} width={4} height={10} rx={1} fill="#E63946" />
        <rect x={34} y={18} width={4} height={10} rx={1} fill="#E63946" />
        {/* Hands */}
        <rect x={10} y={28} width={4} height={3} rx={1} fill="#FFD5B8" />
        <rect x={34} y={28} width={4} height={3} rx={1} fill="#FFD5B8" />
        {/* Quần trắng ló ra dưới gấu áo dài */}
        <rect x={17} y={40} width={6} height={4} fill="#FFF" />
        <rect x={25} y={40} width={6} height={4} fill="#FFF" />
        {/* Viền gấu vàng */}
        <rect x={12} y={39} width={24} height={1} fill="#FFD700" />
        {/* Feet */}
        <rect x={16} y={44} width={7} height={3} rx={1} fill="#333" />
        <rect x={25} y={44} width={7} height={3} rx={1} fill="#333" />
        {/* Nón lá (hat) */}
        <polygon points="24,0 8,5 40,5" fill="#C8A96E" opacity={0.9} />
      </svg>

      {/* Typing dots */}
      {state === 'typing' && !reducedMotion && (
        <div className="absolute -top-2 -right-2 flex gap-0.5">
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}

      {/* Ready idle glow */}
      {state === 'ready' && !reducedMotion && (
        <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-pulse pointer-events-none" />
      )}
    </div>
  );
}
