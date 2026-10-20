import { getAllModels } from '@/services/models-3d';
import { ModelList } from './ModelList';
import { CreateModelForm } from './CreateModelForm';

export default async function ModelsPage() {
  const models = await getAllModels();

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Quản lý mô hình 3D</h1>
        <CreateModelForm />
      </div>
      <ModelList models={models} />
    </div>
  );
}
