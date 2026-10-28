import { getCurrentProfile } from '@/lib/auth/session';
import { getAssignment, getSubmissionStats, getQuestionAnalytics } from '@/services/assignments';
import { redirect } from 'next/navigation';
import { getLocale } from '@/lib/i18n/server';
import { translate, type DictKey } from '@/lib/i18n/dict';

type Props = { params: Promise<{ id: string }> };

export default async function AssignmentDetailPage({ params }: Props) {
  const locale = await getLocale();
  const tr = (key: DictKey) => translate(locale, key);
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

  const statusMap: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: 'bg-slate-800', text: 'text-slate-400', label: tr('as.draft') },
    submitted: { bg: 'bg-blue-900', text: 'text-blue-300', label: tr('as.submitted') },
    graded: { bg: 'bg-amber-900', text: 'text-amber-300', label: tr('as.graded') },
    published: { bg: 'bg-green-900', text: 'text-green-300', label: tr('as.published') },
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">{assignment.title}</h1>
        {assignment.description && <p className="text-sm text-slate-400 mt-1">{assignment.description}</p>}
        {assignment.due_at && (
          <p className="text-xs text-slate-500 mt-2">
            {tr('as.due')}: {new Date(assignment.due_at).toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label={tr('as.submitted')} value={submitted.length} total={stats.length} />
        <StatCard label={tr('as.graded')} value={graded.length} total={submitted.length || 1} />
        <StatCard
          label={tr('as.avgScore')}
          value={
            graded.length > 0
              ? (graded.reduce((s, g) => s + (g.total_score ?? 0), 0) / graded.length).toFixed(1)
              : '—'
          }
        />
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-bold text-white">{tr('as.submissionList')}</h2>
        {stats.length === 0 ? (
          <p className="text-xs text-slate-400">{tr('as.noStarted')}</p>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400">
                  <th className="text-left px-4 py-2">{tr('as.student')}</th>
                  <th className="text-left px-4 py-2">{tr('as.status')}</th>
                  <th className="text-right px-4 py-2">{tr('as.score')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.id} className="border-b border-slate-800/50">
                    <td className="px-4 py-2 text-white">{s.student.display_name}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={statusMap[s.status] ?? statusMap.draft} />
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
          <h2 className="text-sm font-bold text-white">{tr('as.scoreDist')}</h2>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-green-900/30 border border-green-800/50 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-green-300">{scoreDistribution.excellent}</div>
              <div className="text-[10px] text-green-400">{tr('as.excellent')}</div>
            </div>
            <div className="bg-blue-900/30 border border-blue-800/50 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-blue-300">{scoreDistribution.good}</div>
              <div className="text-[10px] text-blue-400">{tr('as.good')}</div>
            </div>
            <div className="bg-amber-900/30 border border-amber-800/50 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-amber-300">{scoreDistribution.average}</div>
              <div className="text-[10px] text-amber-400">{tr('as.average')}</div>
            </div>
            <div className="bg-red-900/30 border border-red-800/50 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-red-300">{scoreDistribution.weak}</div>
              <div className="text-[10px] text-red-400">{tr('as.weak')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Question-level analytics */}
      {questionAnalytics.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-white">{tr('as.perQuestion')}</h2>
          <div className="space-y-2">
            {questionAnalytics.map((q) => (
              <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 mb-1">{tr('grading.question')} {q.sort_order + 1} · {q.points} {tr('grading.points')}</p>
                    <p className="text-sm text-white">{q.content}</p>
                  </div>
                  <div className={`shrink-0 text-right ${q.correctRate >= 70 ? 'text-green-400' : q.correctRate >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    <div className="text-lg font-bold">{q.correctRate}%</div>
                    <div className="text-[10px]">{tr('as.correctWord')}</div>
                  </div>
                </div>
                {q.totalAttempts > 0 && (
                  <div className="mt-2 flex gap-1 h-2 rounded-full overflow-hidden">
                    {q.correctCount > 0 && (
                      <div
                        className="bg-green-500 rounded-l-full"
                        style={{ width: `${(q.correctCount / q.totalAttempts) * 100}%` }}
                        title={`${q.correctCount} ${tr('as.correctWord')}`}
                      />
                    )}
                    {q.incorrectCount > 0 && (
                      <div
                        className="bg-red-500"
                        style={{ width: `${(q.incorrectCount / q.totalAttempts) * 100}%` }}
                        title={`${q.incorrectCount} ${tr('reports.wrong')}`}
                      />
                    )}
                  </div>
                )}
                <div className="mt-1 flex gap-3 text-[10px] text-slate-500">
                  <span>✓ {q.correctCount} {tr('as.correctWord')}</span>
                  <span>✗ {q.incorrectCount} {tr('reports.wrong')}</span>
                  {q.unansweredCount > 0 && <span>— {q.unansweredCount} {tr('as.unansweredWord')}</span>}
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

function StatusBadge({ status }: { status: { bg: string; text: string; label: string } }) {
  return <span className={`text-xs px-2 py-0.5 rounded ${status.bg} ${status.text}`}>{status.label}</span>;
}
