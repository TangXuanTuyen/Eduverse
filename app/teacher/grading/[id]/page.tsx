import { getCurrentProfile } from '@/lib/auth/session';
import { getSubmissionForGrading } from '@/services/grading';
import { redirect } from 'next/navigation';
import { GradingPanel } from './GradingPanel';

type Props = { params: Promise<{ id: string }> };

export default async function GradeSubmissionPage({ params }: Props) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') redirect('/login');

  const { id } = await params;
  let attempts;
  try {
    attempts = await getSubmissionForGrading(id, profile.id);
  } catch {
    redirect('/teacher/grading');
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <GradingPanel submissionId={id} attempts={attempts} />
    </div>
  );
}
