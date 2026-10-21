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
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Bài giao</h1>
        <div className="flex gap-2">
          <CreateTaskButton teacherId={profile.id} />
          <CreateAssignmentButton teacherId={profile.id} />
        </div>
      </div>
      <AssignmentList assignments={assignments} />
    </div>
  );
}
