import { getCurrentProfile } from '@/lib/auth/session';
import { getTeacherAssignments } from '@/services/assignments';
import { redirect } from 'next/navigation';
import { AssignmentList } from './AssignmentList';
import { CreateAssignmentButton } from './CreateAssignmentButton';
import { CreateTaskButton } from './CreateTaskButton';

export default async function TeacherAssignmentsPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') redirect('/login');

  const assignments = await getTeacherAssignments(profile.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Bài giao</h1>
          <p className="text-sm text-slate-400 mt-1">{assignments.length} bài giao</p>
        </div>
        <div className="flex gap-2">
          <CreateTaskButton teacherId={profile.id} />
          <CreateAssignmentButton teacherId={profile.id} />
        </div>
      </div>
      <AssignmentList assignments={assignments} />
    </div>
  );
}
