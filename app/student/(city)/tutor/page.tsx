'use client';

import React, { useState, useEffect } from 'react';
import { DialogFrame } from '@/components/ui/DialogFrame';
import { TutorChat } from '@/components/tutor/TutorChat';
import type { TutorMode } from '@/services/ai-tutor';

type ConvSummary = {
  id: string;
  mode: string;
  message_count: number;
  updated_at: string;
};

const MODES: { value: TutorMode; label: string; icon: string }[] = [
  { value: 'lesson', label: 'Bài học', icon: '📖' },
  { value: 'assignment', label: 'Bài tập', icon: '📝' },
  { value: 'review', label: 'Ôn tập', icon: '🔄' },
];

export default function TutorPage() {
  const [mode, setMode] = useState<TutorMode>('review');
  const [conversations, setConversations] = useState<ConvSummary[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string>();
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetch('/api/tutor/history')
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations ?? []))
      .catch(() => {});
  }, []);

  const startNew = (m: TutorMode) => {
    setMode(m);
    setSelectedConvId(undefined);
  };

  return (
    <DialogFrame label="AI Trợ lý học tập">
      <div className="flex h-[min(70vh,600px)]">
        {/* Sidebar */}
        <div className="w-48 shrink-0 border-r border-slate-700 flex flex-col max-md:hidden">
          <div className="p-3 space-y-1">
            {MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => startNew(m.value)}
                className={`w-full min-h-[44px] text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  mode === m.value && !selectedConvId
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-700 flex-1 overflow-y-auto p-2">
            <p className="text-[10px] text-slate-500 px-2 mb-1 uppercase tracking-wider">Lịch sử</p>
            {conversations.length === 0 && (
              <p className="text-xs text-slate-600 px-2">Chưa có</p>
            )}
            {conversations.slice(0, 10).map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedConvId(c.id);
                  setMode(c.mode as TutorMode);
                }}
                className={`w-full text-left px-2 py-1.5 rounded text-xs truncate ${
                  selectedConvId === c.id
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {c.mode === 'lesson' ? '📖' : c.mode === 'assignment' ? '📝' : '🔄'}{' '}
                {c.message_count} tin • {new Date(c.updated_at).toLocaleDateString('vi')}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile mode toggle */}
        <div className="md:hidden absolute top-12 left-0 right-0 flex border-b border-slate-700 bg-slate-900 z-10">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => startNew(m.value)}
              className={`flex-1 min-h-[44px] text-center text-xs py-2 ${
                mode === m.value ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'
              }`}
            >
              {m.icon} {m.label}
            </button>
          ))}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400"
            aria-label="Lịch sử"
          >
            🕐
          </button>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0 md:pt-0 pt-10">
          <TutorChat
            key={`${mode}-${selectedConvId ?? 'new'}`}
            mode={mode}
            conversationId={selectedConvId}
          />
        </div>
      </div>
    </DialogFrame>
  );
}
