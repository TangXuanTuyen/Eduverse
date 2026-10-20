import { getCurrentProfile } from '@/lib/auth/session';
import { getStudentAssignments } from '@/services/assignments';
import { redirect } from 'next/navigation';
import { StudentAssignmentList } from './StudentAssignmentList';

export default async function StudentAssignmentsRealPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'student') redirect('/login');

  const assignments = await getStudentAssignments(profile.id);

  return <StudentAssignmentList assignments={assignments} />;
}
