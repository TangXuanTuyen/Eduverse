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

  // Task assignments → redirect to the relevant building
  if (assignment.assignment_type === 'lesson') redirect('/student/library');
  if (assignment.assignment_type === 'experiment') redirect('/student/virtual-lab');
  if (assignment.assignment_type === 'model3d') redirect('/student/world-3d');
  if (assignment.assignment_type === 'stem') redirect('/student/stem');

  // Get questions via the student function (no correct_answer)
  const admin = createAdminClient();
  const { data: questions } = await admin.rpc('get_assignment_questions_student', {
    p_assignment_id: id,
  });

  if (!questions || questions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4">
        <div className="rounded-2xl bg-slate-900 border border-slate-700 p-8 text-center max-w-md">
          <p className="text-2xl mb-3">📝</p>
          <h2 className="text-lg font-bold text-white mb-2">{assignment.title}</h2>
          <p className="text-slate-400 mb-4">Bài tập này chưa có câu hỏi hoặc bạn không thuộc lớp được giao.</p>
          <a href="/student/assignments/real" className="inline-block px-4 py-2 rounded-lg bg-blue-600 text-white min-h-[44px] leading-[44px]">
            Quay lại danh sách
          </a>
        </div>
      </div>
    );
  }

  const draft = await getOrCreateDraft(id, profile.id);
  const attempts = await getStudentAttempts(draft.id);

  const savedAnswers: Record<string, unknown> = {};
  for (const a of attempts) {
    savedAnswers[a.assignment_question_id] = a.student_answer;
  }

  return (
    <AssignmentTaker
      assignment={assignment}
      questions={questions}
      submission={draft}
      savedAnswers={savedAnswers}
    />
  );
}
