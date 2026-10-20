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
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold text-white">Báo cáo</h1>
      <DashboardView
        assignments={assignments}
        selectedAssignment={selectedId}
        questionStats={questionStats}
      />
    </div>
  );
}
