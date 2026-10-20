'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

export function CompanionChat({
  onClose,
  onOpenFullPage,
}: {
  onClose: () => void;
  onOpenFullPage: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
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
          mode: 'companion',
          conversationId,
          source: 'companion',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Lỗi khi gửi tin nhắn.');
        return;
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      if (data.conversationId) setConversationId(data.conversationId);
      if (data.remainingQuota != null) setRemaining(data.remainingQuota);
    } catch {
      setError('Không thể kết nối. Thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [input, loading, conversationId]);

  return (
    <div
      className="flex flex-col w-[min(360px,calc(100vw-2rem))] h-[min(480px,60vh)] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden"
      role="dialog"
      aria-label="Trò chuyện với Vina"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-300 truncate">Vina — Bạn đồng hành AI</p>
          <p className="text-[10px] text-slate-400">AI có thể sai, hãy kiểm tra với thầy cô</p>
        </div>
        <div className="flex gap-1 ml-2 shrink-0">
          <button
            onClick={onOpenFullPage}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white"
            aria-label="Mở trang đầy đủ"
            title="Mở trang đầy đủ"
          >
            <svg width={16} height={16} viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 2h5v2H4v3H2V2zm7 0h5v5h-2V4H9V2zM2 9h2v3h3v2H2V9zm12 0v5H9v-2h3V9h2z" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-slate-500 text-center mt-8">
            Chào bạn! Mình là Vina 🌟 Hỏi mình bất cứ gì về KHTN nhé!
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
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
            <div className="bg-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm">
              Vina đang nghĩ…
            </div>
          </div>
        )}
        {error && (
          <div className="text-center text-xs text-red-400">{error}</div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-slate-700 p-2">
        {remaining != null && remaining <= 5 && (
          <p className="text-[10px] text-amber-400 mb-1 px-1">Còn {remaining} lượt hôm nay</p>
        )}
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
            placeholder="Hỏi Vina..."
            rows={1}
            className="flex-1 min-h-[44px] max-h-20 resize-none bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border border-slate-600 focus:border-amber-500 focus:outline-none"
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="min-h-[44px] min-w-[44px] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-900 font-bold rounded-lg px-3 transition-colors"
            aria-label="Gửi"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
