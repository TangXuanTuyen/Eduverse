'use client';

import { useRouter } from 'next/navigation';
import type { AssignmentRow } from '@/services/assignments';
import type { QuestionStat } from '@/services/dashboard';
import { ExportButton } from './ExportButton';

type Props = {
  assignments: AssignmentRow[];
  selectedAssignment?: string;
  questionStats: QuestionStat[];
};

export function DashboardView({ assignments, selectedAssignment, questionStats }: Props) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Assignment selector */}
      <div className="flex items-center gap-3">
        <select
          value={selectedAssignment ?? ''}
          onChange={(e) => router.push(`/teacher/dashboard?assignment=${e.target.value}`)}
          className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white min-h-[44px] flex-1"
        >
          {assignments.length === 0 && <option value="">Chưa có bài giao</option>}
          {assignments.map((a) => (
            <option key={a.id} value={a.id}>{a.title}</option>
          ))}
        </select>
        {selectedAssignment && <ExportButton assignmentId={selectedAssignment} />}
      </div>

      {/* Question analytics */}
      {questionStats.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white">Tỉ lệ đúng theo câu hỏi</h2>
          {questionStats.map((q, i) => (
            <div key={q.question_id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-white">Câu {i + 1}: {q.content}</p>
                <span className="text-xs text-slate-400">{q.total_attempts} lượt</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      q.accuracy >= 70 ? 'bg-green-500' : q.accuracy >= 40 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${q.accuracy}%` }}
                  />
                </div>
                <span className="text-sm font-mono text-white w-12 text-right">{q.accuracy}%</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-400 text-sm text-center py-8">Chưa có dữ liệu.</p>
      )}
    </div>
  );
}
