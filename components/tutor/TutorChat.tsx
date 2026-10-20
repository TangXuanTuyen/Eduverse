'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { TutorMode } from '@/services/ai-tutor';

type Message = { id?: string; role: 'user' | 'assistant'; content: string; createdAt?: string };

export function TutorChat({
  mode,
  contextType,
  contextId,
  roomId,
  conversationId: initialConvId,
  initialMessages,
}: {
  mode: TutorMode;
  contextType?: string;
  contextId?: string;
  roomId?: string;
  conversationId?: string;
  initialMessages?: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages ?? []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(initialConvId);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          mode,
          conversationId,
          contextType,
          contextId,
          roomId,
          source: 'page',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Lỗi.');
        return;
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      if (data.conversationId) setConversationId(data.conversationId);
      if (data.remainingQuota != null) setRemaining(data.remainingQuota);
    } catch {
      setError('Không thể kết nối.');
    } finally {
      setLoading(false);
    }
  }, [input, loading, conversationId, mode, contextType, contextId, roomId]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-slate-500 text-center mt-12">
            {mode === 'review'
              ? 'Hỏi bất cứ gì về KHTN lớp 6-9!'
              : mode === 'assignment'
                ? 'Hỏi AI để được gợi ý (không đáp án trực tiếp).'
                : 'Bắt đầu hỏi về nội dung bài học.'}
          </p>
        )}
        {messages.map((m, i) => (
          <div key={m.id ?? i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-100'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 text-slate-300 rounded-xl px-4 py-2.5 text-sm animate-pulse">
              AI đang trả lời…
            </div>
          </div>
        )}
        {error && <p className="text-center text-xs text-red-400">{error}</p>}
      </div>

      {/* Input */}
      <div className="border-t border-slate-700 p-3 bg-slate-800/50">
        <div className="flex items-center gap-1 mb-2">
          <p className="text-[11px] text-slate-500 flex-1">AI có thể sai — hãy kiểm tra với thầy cô</p>
          {remaining != null && (
            <p className="text-[11px] text-amber-400 shrink-0">Còn {remaining} lượt</p>
          )}
        </div>
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Nhập câu hỏi…"
            rows={1}
            className="flex-1 min-h-[44px] max-h-24 resize-none bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="min-h-[44px] min-w-[44px] bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold rounded-lg px-4 transition-colors"
            aria-label="Gửi"
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
