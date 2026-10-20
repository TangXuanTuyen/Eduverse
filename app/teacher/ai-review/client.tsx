'use client';

import React from 'react';

type Stats = {
  totalConversations: number;
  totalMessages: number;
  topModes: { mode: string; count: number }[];
};

type Alert = {
  id: string;
  conversation_id: string;
  content: string;
  flag_reason: string | null;
  created_at: string;
};

const MODE_LABELS: Record<string, string> = {
  lesson: 'Bài học',
  assignment: 'Bài tập',
  review: 'Ôn tập',
  companion: 'Bạn đồng hành',
};

export function AIReviewClient({
  rooms,
  stats,
  alerts,
}: {
  rooms: { id: string; name: string }[];
  stats: Stats;
  alerts: Alert[];
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">AI Tutor — Tổng quan</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Hội thoại" value={stats.totalConversations} />
        <StatCard label="Tin nhắn" value={stats.totalMessages} />
        <StatCard label="Phòng học" value={rooms.length} />
      </div>

      {/* Mode breakdown */}
      {stats.topModes.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Phân bố chế độ</h2>
          <div className="space-y-2">
            {stats.topModes.map((m) => (
              <div key={m.mode} className="flex items-center gap-3">
                <span className="text-sm text-slate-400 w-28">{MODE_LABELS[m.mode] ?? m.mode}</span>
                <div className="flex-1 bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (m.count / stats.totalConversations) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-8 text-right">{m.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety alerts */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-red-400 mb-3">
          Cảnh báo an toàn ({alerts.length})
        </h2>
        {alerts.length === 0 ? (
          <p className="text-sm text-slate-500">Không có cảnh báo.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alerts.map((a) => (
              <div key={a.id} className="bg-slate-900 rounded p-3 border border-red-900/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-red-400 font-medium">
                    {a.flag_reason ?? 'Đã gắn cờ'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(a.created_at).toLocaleString('vi')}
                  </span>
                </div>
                <p className="text-sm text-slate-300 line-clamp-2">{a.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 text-center">
      <p className="text-2xl font-bold text-white">{value.toLocaleString('vi')}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}
