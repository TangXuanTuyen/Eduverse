'use client';

import React from 'react';
import { useLocale } from '@/components/i18n/LocaleProvider';

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

export function AIReviewClient({
  rooms,
  stats,
  alerts,
}: {
  rooms: { id: string; name: string }[];
  stats: Stats;
  alerts: Alert[];
}) {
  const { t, locale } = useLocale();
  const numberLocale = locale === 'en' ? 'en-US' : 'vi';
  const MODE_LABELS: Record<string, string> = {
    lesson: t('ai.rev.lesson'),
    assignment: t('ai.rev.assignment'),
    review: t('ai.rev.review'),
    companion: t('ai.rev.companion'),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">{t('ai.rev.title')}</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={t('ai.rev.conversations')} value={stats.totalConversations} locale={numberLocale} />
        <StatCard label={t('ai.rev.messages')} value={stats.totalMessages} locale={numberLocale} />
        <StatCard label={t('nav.teacher.rooms')} value={rooms.length} locale={numberLocale} />
      </div>

      {/* Mode breakdown */}
      {stats.topModes.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">{t('ai.rev.modeDist')}</h2>
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
          {t('ai.rev.alerts')} ({alerts.length})
        </h2>
        {alerts.length === 0 ? (
          <p className="text-sm text-slate-500">{t('ai.rev.noAlerts')}</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alerts.map((a) => (
              <div key={a.id} className="bg-slate-900 rounded p-3 border border-red-900/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-red-400 font-medium">
                    {a.flag_reason ?? t('ai.rev.flagged')}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(a.created_at).toLocaleString(numberLocale)}
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

function StatCard({ label, value, locale }: { label: string; value: number; locale: string }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 text-center">
      <p className="text-2xl font-bold text-white">{value.toLocaleString(locale)}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}
