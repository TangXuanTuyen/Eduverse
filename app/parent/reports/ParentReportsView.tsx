'use client';

import { useCallback, useEffect, useState } from 'react';

type Child = { student_id: string; display_name: string; grade: number | null };

type WeeklySummary = {
  student_id: string;
  display_name: string;
  week_start: string;
  summary_text: string;
  stats: {
    xp_earned: number;
    assignments_completed: number;
    assignments_total: number;
    avg_score: number;
    games_played: number;
    reviews_fixed: number;
    badges_earned: string[];
  };
  suggestions: string[];
  missing_assignments: Array<{ title: string; due_at: string | null }>;
  published_results: Array<{
    title: string;
    score: number | null;
    max_score: number | null;
    feedback: string | null;
  }>;
};

export function ParentReportsView({ children: kids }: { children: Child[] }) {
  const [selectedKid, setSelectedKid] = useState(kids[0]?.student_id ?? '');
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSummary = useCallback(async (studentId: string) => {
    if (!studentId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/parent/reports?student=${studentId}&view=summary`);
      if (!res.ok) {
        setError('Không thể tải báo cáo.');
        setSummary(null);
        return;
      }
      setSummary(await res.json());
    } catch {
      setError('Lỗi kết nối.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedKid) fetchSummary(selectedKid);
  }, [selectedKid, fetchSummary]);

  if (kids.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold">Báo cáo</h1>
        <p className="text-sm text-slate-400 bg-slate-900 border border-slate-800 rounded-xl p-4">
          Chưa có liên kết nào được duyệt.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Báo cáo tuần</h1>

      {/* Child selector */}
      {kids.length > 1 && (
        <div className="flex gap-2">
          {kids.map((k) => (
            <button
              key={k.student_id}
              onClick={() => setSelectedKid(k.student_id)}
              className={`px-4 py-2 rounded-lg text-sm min-h-[44px] ${
                selectedKid === k.student_id
                  ? 'bg-white text-slate-900 font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {k.display_name}
              {k.grade && <span className="text-xs ml-1 opacity-60">K{k.grade}</span>}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="text-slate-400 text-sm text-center py-8">Đang tải...</p>}
      {error && <p className="text-red-400 text-sm bg-slate-900 border border-red-800 rounded-xl p-4">{error}</p>}

      {summary && !loading && (
        <>
          {/* Summary text */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-bold mb-2">
              Tuần {formatDate(summary.week_start)} — {summary.display_name}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">{summary.summary_text}</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="XP kiếm được" value={summary.stats.xp_earned} />
            <StatCard
              label="Bài hoàn thành"
              value={`${summary.stats.assignments_completed}/${summary.stats.assignments_total}`}
            />
            <StatCard label="Điểm TB" value={summary.stats.avg_score > 0 ? `${summary.stats.avg_score}%` : '—'} />
            <StatCard label="Trò chơi" value={summary.stats.games_played} />
          </div>

          {/* Missing assignments */}
          {summary.missing_assignments.length > 0 && (
            <div className="bg-amber-900/30 border border-amber-800 rounded-xl p-4">
              <h3 className="text-sm font-bold text-amber-300 mb-2">Bài chưa hoàn thành</h3>
              <ul className="space-y-1">
                {summary.missing_assignments.map((a, i) => (
                  <li key={i} className="text-sm text-amber-200">
                    • {a.title}
                    {a.due_at && (
                      <span className="text-xs text-amber-400 ml-2">
                        Hạn: {formatDate(a.due_at)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Published results */}
          {summary.published_results.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-bold mb-2">Kết quả đã công bố</h3>
              <div className="space-y-2">
                {summary.published_results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span>{r.title}</span>
                    <span className="font-mono">
                      {r.score != null && r.max_score != null
                        ? `${r.score}/${r.max_score}`
                        : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {summary.suggestions.length > 0 && (
            <div className="bg-slate-900 border border-green-900 rounded-xl p-4">
              <h3 className="text-sm font-bold mb-2 text-green-400">Gợi ý câu hỏi cho phụ huynh</h3>
              <ul className="space-y-2">
                {summary.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-slate-300 leading-relaxed">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Badges */}
          {summary.stats.badges_earned.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-bold mb-2">Huy hiệu mới</h3>
              <div className="flex gap-2 flex-wrap">
                {summary.stats.badges_earned.map((b) => (
                  <span key={b} className="px-3 py-1 bg-slate-800 rounded-full text-xs">{b}</span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}
