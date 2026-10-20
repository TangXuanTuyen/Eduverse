import { getCurrentProfile } from '@/lib/auth/session';
import { getGradingQueue } from '@/services/grading';
import { redirect } from 'next/navigation';
import { GradingQueue } from './GradingQueue';

export default async function GradingPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') redirect('/login');

  const queue = await getGradingQueue(profile.id);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold text-white">Chấm bài</h1>
      <GradingQueue items={queue} />
    </div>
  );
}
