import { getAllPublishedModels } from '@/services/models-3d';
import { ModelCatalog } from './ModelCatalog';

export default async function TeacherModelsPage() {
  const models = await getAllPublishedModels();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mô hình 3D</h1>
        <p className="text-sm text-slate-400 mt-1">Khám phá mô hình 3D tương tác và giao cho học sinh</p>
      </div>
      <ModelCatalog models={models} />
    </div>
  );
}
