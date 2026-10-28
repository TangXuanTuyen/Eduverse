import { getCurrentProfile } from '@/lib/auth/session';
import { getGradingQueue } from '@/services/grading';
import { redirect } from 'next/navigation';
import { GradingQueue } from './GradingQueue';
import { getLocale } from '@/lib/i18n/server';
import { translate } from '@/lib/i18n/dict';

export default async function GradingPage() {
  const locale = await getLocale();
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') redirect('/login');

  const queue = await getGradingQueue(profile.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{translate(locale, 'grading.title')}</h1>
        <p className="text-sm text-slate-400 mt-1">{queue.length} {translate(locale, 'grading.pendingUnit')}</p>
      </div>
      <GradingQueue items={queue} />
    </div>
  );
}
