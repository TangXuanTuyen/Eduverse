import { getAllPublishedExperiments } from '@/services/experiments';
import { LabCatalog } from './LabCatalog';

export default async function TeacherLabsPage() {
  const experiments = await getAllPublishedExperiments();

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold text-white">Phòng thí nghiệm ảo</h1>
      <p className="text-sm text-slate-400">Duyệt danh mục thí nghiệm và giao cho lớp học</p>
      <LabCatalog experiments={experiments} />
    </div>
  );
}
