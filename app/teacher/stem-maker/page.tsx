import { getCurrentProfile } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { StemMakerList } from './StemMakerList';
import { getLocale } from '@/lib/i18n/server';
import { translate } from '@/lib/i18n/dict';

export default async function StemMakerPage() {
  const locale = await getLocale();
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') redirect('/login');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{translate(locale, 'stem.title')}</h1>
        <p className="text-sm text-slate-400 mt-1">
          {translate(locale, 'stem.desc')}
        </p>
      </div>
      <StemMakerList teacherId={profile.id} />
    </div>
  );
}
