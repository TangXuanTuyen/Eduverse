import { getAllPublishedExperiments } from '@/services/experiments';
import { LabCatalog } from './LabCatalog';

export default async function TeacherLabsPage() {
  const experiments = await getAllPublishedExperiments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Phòng thí nghiệm ảo</h1>
        <p className="text-sm text-slate-400 mt-1">Duyệt danh mục thí nghiệm và giao cho lớp học</p>
      </div>
      <LabCatalog experiments={experiments} />
    </div>
  );
}
