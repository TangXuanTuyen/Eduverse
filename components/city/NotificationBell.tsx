'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, X, Check, BookOpen } from 'lucide-react';
import { DialogFrame } from '@/components/ui/DialogFrame';
import Link from 'next/link';

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnread(data.unread_count ?? 0);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mark_all_read: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  }

  function getTypeIcon(type: string) {
    if (type === 'new_assignment') return <BookOpen className="w-4 h-4 text-blue-400" />;
    return <Bell className="w-4 h-4 text-slate-400" />;
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Thông báo${unread > 0 ? ` — ${unread} chưa đọc` : ''}`}
        onClick={() => setOpen(true)}
        className="relative min-h-11 min-w-11 flex items-center justify-center bg-slate-900/85 hover:bg-slate-800 border border-slate-700/70 text-slate-200 rounded-lg shadow-md backdrop-blur-md cursor-pointer transition hover:text-white"
      >
        <Bell className="w-4 h-4 text-amber-300" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <DialogFrame
          onClose={() => setOpen(false)}
          label="Thông báo"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[80vh] text-slate-100">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Thông báo</h3>
                {unread > 0 && (
                  <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-medium">
                    {unread} mới
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="min-h-11 px-2 py-1 text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Đọc hết
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Đóng"
                  className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center text-slate-500 py-10 text-sm">Chưa có thông báo nào</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-5 py-3 border-b border-slate-800/50 flex items-start gap-3 transition ${
                      n.is_read ? 'opacity-60' : 'bg-slate-800/30'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{getTypeIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">{n.title}</p>
                      {n.body && <p className="text-xs text-slate-400 mt-0.5">{n.body}</p>}
                      <p className="text-[10px] text-slate-500 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {n.type === 'new_assignment' && (
                      <Link
                        href="/student/assignments/real"
                        onClick={() => setOpen(false)}
                        className="shrink-0 text-xs text-blue-400 hover:text-blue-300 underline mt-1 min-h-[44px] flex items-center"
                      >
                        Làm bài
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogFrame>
      )}
    </>
  );
}
