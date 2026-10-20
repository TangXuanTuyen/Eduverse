import { getCurrentProfile } from '@/lib/auth/session';
import { getAssignment } from '@/services/assignments';
import { getOrCreateDraft, getStudentAttempts } from '@/services/submissions';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { AssignmentTaker } from './AssignmentTaker';

type Props = { params: Promise<{ id: string }> };

export default async function TakeAssignmentPage({ params }: Props) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'student') redirect('/login');

  const { id } = await params;

  let assignment;
  try {
    assignment = await getAssignment(id);
  } catch {
    redirect('/student/assignments/real');
  }

  // Get questions via the student function (no correct_answer)
  const admin = createAdminClient();
  const { data: questions } = await admin.rpc('get_assignment_questions_student', {
    p_assignment_id: id,
  });

  const draft = await getOrCreateDraft(id, profile.id);
  const attempts = await getStudentAttempts(draft.id);

  const savedAnswers: Record<string, unknown> = {};
  for (const a of attempts) {
    savedAnswers[a.assignment_question_id] = a.student_answer;
  }

  return (
    <AssignmentTaker
      assignment={assignment}
      questions={questions ?? []}
      submission={draft}
      savedAnswers={savedAnswers}
    />
  );
}
