import { getAllPublishedModels } from '@/services/models-3d';
import { ModelCatalog } from './ModelCatalog';
import { getLocale } from '@/lib/i18n/server';
import { translate } from '@/lib/i18n/dict';

export default async function TeacherModelsPage() {
  const locale = await getLocale();
  const models = await getAllPublishedModels();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{translate(locale, 'model.title')}</h1>
        <p className="text-sm text-slate-400 mt-1">{translate(locale, 'model.desc')}</p>
      </div>
      <ModelCatalog models={models} />
    </div>
  );
}
