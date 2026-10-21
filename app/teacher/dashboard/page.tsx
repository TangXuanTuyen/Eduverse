import { getCurrentProfile } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getTeacherAssignments } from '@/services/assignments';
import { getQuestionStats } from '@/services/dashboard';
import { DashboardView } from './DashboardView';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') redirect('/login');

  const params = await searchParams;
  const assignments = await getTeacherAssignments(profile.id);
  const selectedId = typeof params.assignment === 'string' ? params.assignment : assignments[0]?.id;

  let questionStats: Awaited<ReturnType<typeof getQuestionStats>> = [];
  if (selectedId) {
    questionStats = await getQuestionStats(selectedId);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Báo cáo</h1>
        <p className="text-sm text-slate-400 mt-1">Phân tích chi tiết kết quả học sinh</p>
      </div>
      <DashboardView
        assignments={assignments}
        selectedAssignment={selectedId}
        questionStats={questionStats}
      />
    </div>
  );
}
