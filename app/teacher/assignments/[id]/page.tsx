import { getCurrentProfile } from '@/lib/auth/session';
import { getAssignment, getSubmissionStats, getQuestionAnalytics } from '@/services/assignments';
import { redirect } from 'next/navigation';

type Props = { params: Promise<{ id: string }> };

export default async function AssignmentDetailPage({ params }: Props) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') redirect('/login');

  const { id } = await params;

  let assignment;
  try {
    assignment = await getAssignment(id);
  } catch {
    redirect('/teacher/assignments');
  }

  const [stats, questionAnalytics] = await Promise.all([
    getSubmissionStats(id),
    getQuestionAnalytics(id),
  ]);
  const submitted = stats.filter((s) => s.status !== 'draft');
  const graded = stats.filter((s) => s.status === 'graded' || s.status === 'published');

  const scores = graded.map((s) => s.total_score ?? 0);
  const maxScore = graded[0]?.max_score ?? 0;
  const scoreDistribution = maxScore > 0 ? {
    excellent: scores.filter((s) => s / maxScore >= 0.9).length,
    good: scores.filter((s) => s / maxScore >= 0.7 && s / maxScore < 0.9).length,
    average: scores.filter((s) => s / maxScore >= 0.5 && s / maxScore < 0.7).length,
    weak: scores.filter((s) => s / maxScore < 0.5).length,
  } : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">{assignment.title}</h1>
        {assignment.description && <p className="text-sm text-slate-400 mt-1">{assignment.description}</p>}
        {assignment.due_at && (
          <p className="text-xs text-slate-500 mt-2">
            Hạn: {new Date(assignment.due_at).toLocaleString('vi-VN')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Đã nộp" value={submitted.length} total={stats.length} />
        <StatCard label="Đã chấm" value={graded.length} total={submitted.length || 1} />
        <StatCard
          label="Điểm TB"
          value={
            graded.length > 0
              ? (graded.reduce((s, g) => s + (g.total_score ?? 0), 0) / graded.length).toFixed(1)
              : '—'
          }
        />
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-bold text-white">Danh sách bài nộp</h2>
        {stats.length === 0 ? (
          <p className="text-xs text-slate-400">Chưa có học sinh nào bắt đầu làm bài.</p>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400">
                  <th className="text-left px-4 py-2">Học sinh</th>
                  <th className="text-left px-4 py-2">Trạng thái</th>
                  <th className="text-right px-4 py-2">Điểm</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.id} className="border-b border-slate-800/50">
                    <td className="px-4 py-2 text-white">{s.profiles.display_name}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-2 text-right text-slate-300">
                      {s.total_score != null ? `${s.total_score}/${s.max_score}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Score distribution */}
      {scoreDistribution && graded.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-white">Phân bố điểm</h2>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-green-900/30 border border-green-800/50 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-green-300">{scoreDistribution.excellent}</div>
              <div className="text-[10px] text-green-400">Giỏi (≥90%)</div>
            </div>
            <div className="bg-blue-900/30 border border-blue-800/50 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-blue-300">{scoreDistribution.good}</div>
              <div className="text-[10px] text-blue-400">Khá (70-89%)</div>
            </div>
            <div className="bg-amber-900/30 border border-amber-800/50 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-amber-300">{scoreDistribution.average}</div>
              <div className="text-[10px] text-amber-400">TB (50-69%)</div>
            </div>
            <div className="bg-red-900/30 border border-red-800/50 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-red-300">{scoreDistribution.weak}</div>
              <div className="text-[10px] text-red-400">Yếu (&lt;50%)</div>
            </div>
          </div>
        </div>
      )}

      {/* Question-level analytics */}
      {questionAnalytics.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-white">Phân tích từng câu hỏi</h2>
          <div className="space-y-2">
            {questionAnalytics.map((q) => (
              <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 mb-1">Câu {q.sort_order + 1} · {q.points} điểm</p>
                    <p className="text-sm text-white">{q.content}</p>
                  </div>
                  <div className={`shrink-0 text-right ${q.correctRate >= 70 ? 'text-green-400' : q.correctRate >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    <div className="text-lg font-bold">{q.correctRate}%</div>
                    <div className="text-[10px]">đúng</div>
                  </div>
                </div>
                {q.totalAttempts > 0 && (
                  <div className="mt-2 flex gap-1 h-2 rounded-full overflow-hidden">
                    {q.correctCount > 0 && (
                      <div
                        className="bg-green-500 rounded-l-full"
                        style={{ width: `${(q.correctCount / q.totalAttempts) * 100}%` }}
                        title={`${q.correctCount} đúng`}
                      />
                    )}
                    {q.incorrectCount > 0 && (
                      <div
                        className="bg-red-500"
                        style={{ width: `${(q.incorrectCount / q.totalAttempts) * 100}%` }}
                        title={`${q.incorrectCount} sai`}
                      />
                    )}
                  </div>
                )}
                <div className="mt-1 flex gap-3 text-[10px] text-slate-500">
                  <span>✓ {q.correctCount} đúng</span>
                  <span>✗ {q.incorrectCount} sai</span>
                  {q.unansweredCount > 0 && <span>— {q.unansweredCount} chưa trả lời</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, total }: { label: string; value: string | number; total?: number }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
      <div className="text-lg font-bold text-white">
        {value}{total != null && <span className="text-slate-500 text-sm">/{total}</span>}
      </div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: 'bg-slate-800', text: 'text-slate-400', label: 'Nháp' },
    submitted: { bg: 'bg-blue-900', text: 'text-blue-300', label: 'Đã nộp' },
    graded: { bg: 'bg-amber-900', text: 'text-amber-300', label: 'Đã chấm' },
    published: { bg: 'bg-green-900', text: 'text-green-300', label: 'Đã công bố' },
  };
  const s = map[status] ?? map.draft;
  return <span className={`text-xs px-2 py-0.5 rounded ${s.bg} ${s.text}`}>{s.label}</span>;
}
