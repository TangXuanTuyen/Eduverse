import { getAllPublishedModels } from '@/services/models-3d';
import { ModelCatalog } from './ModelCatalog';

export default async function TeacherModelsPage() {
  const models = await getAllPublishedModels();

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold text-white">Mô hình 3D</h1>
      <p className="text-sm text-slate-400">Khám phá mô hình 3D tương tác và giao cho học sinh</p>
      <ModelCatalog models={models} />
    </div>
  );
}
