import { getAllPublishedExperiments } from '@/services/experiments';
import { LabCatalog } from './LabCatalog';
import { getLocale } from '@/lib/i18n/server';
import { translate } from '@/lib/i18n/dict';

export default async function TeacherLabsPage() {
  const locale = await getLocale();
  const experiments = await getAllPublishedExperiments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{translate(locale, 'lab.title')}</h1>
        <p className="text-sm text-slate-400 mt-1">{translate(locale, 'lab.desc')}</p>
      </div>
      <LabCatalog experiments={experiments} />
    </div>
  );
}
