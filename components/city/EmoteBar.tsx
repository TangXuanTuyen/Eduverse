'use client';

import React, { useState } from 'react';
import { PRESET_EMOTES, CONTEXT_PHRASES, type PresetEmote } from '@/game/config/town-map';
import { MessageCircle, Flag } from 'lucide-react';

interface EmoteBarProps {
  onEmote: (emote: PresetEmote) => void;
  onPhrase: (phrase: string) => void;
  onReport: () => void;
  context?: string;
  disabled?: boolean;
}

export function EmoteBar({ onEmote, onPhrase, onReport, context = 'default', disabled }: EmoteBarProps) {
  const [showPhrases, setShowPhrases] = useState(false);
  const phrases = CONTEXT_PHRASES[context] ?? CONTEXT_PHRASES.default;

  if (disabled) return null;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/70 backdrop-blur-md rounded-xl px-2 py-1.5 shadow-lg">
      {PRESET_EMOTES.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onEmote(e)}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-800 transition text-lg cursor-pointer active:scale-90"
          aria-label={`Gửi biểu cảm ${e}`}
        >
          {e}
        </button>
      ))}

      <div className="w-px h-6 bg-slate-700 mx-1" />

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowPhrases(!showPhrases)}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-800 transition cursor-pointer"
          aria-label="Mở câu nói sẵn"
        >
          <MessageCircle className="w-4 h-4 text-indigo-400" />
        </button>

        {showPhrases && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 rounded-xl p-2 shadow-xl min-w-[160px] space-y-1">
            {phrases.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => { onPhrase(p); setShowPhrases(false); }}
                className="w-full text-left text-xs text-slate-200 hover:bg-slate-800 rounded-lg px-3 py-2 transition cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onReport}
        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-rose-900/40 transition cursor-pointer"
        aria-label="Báo cáo"
        title="Báo cáo hành vi không phù hợp"
      >
        <Flag className="w-4 h-4 text-rose-400" />
      </button>
    </div>
  );
}
