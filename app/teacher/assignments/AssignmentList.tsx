'use client';

import Link from 'next/link';
import type { AssignmentRow } from '@/services/assignments';

const STATUS_LABEL: Record<string, string> = {
  hard_lock: 'Khóa khi hết hạn',
  marked_late: 'Cho nộp muộn',
};

type Props = { assignments: AssignmentRow[] };

export function AssignmentList({ assignments }: Props) {
  if (assignments.length === 0) {
    return (
      <div className="text-center text-slate-400 py-12">
        Chưa có bài giao nào.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {assignments.map((a) => (
        <Link
          key={a.id}
          href={`/teacher/assignments/${a.id}`}
          className="block bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-white font-medium text-sm">{a.title}</h3>
              {a.description && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{a.description}</p>}
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                {a.due_at && (
                  <span>Hạn: {new Date(a.due_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                )}
                <span>{STATUS_LABEL[a.late_policy]}</span>
                {a.max_retries > 0 && <span>{a.max_retries} lượt thử</span>}
              </div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded ${a.results_published ? 'bg-green-900 text-green-300' : 'bg-slate-800 text-slate-400'}`}>
              {a.results_published ? 'Đã công bố' : 'Chưa công bố'}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
