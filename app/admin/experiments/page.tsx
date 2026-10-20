import { getAllExperiments } from '@/services/experiments';
import { ExperimentList } from './ExperimentList';
import { CreateExperimentForm } from './CreateExperimentForm';

export default async function ExperimentsPage() {
  const experiments = await getAllExperiments();

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Quản lý thí nghiệm</h1>
        <CreateExperimentForm />
      </div>
      <ExperimentList experiments={experiments} />
    </div>
  );
}
