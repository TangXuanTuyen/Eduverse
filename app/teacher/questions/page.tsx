import { getCurrentProfile } from '@/lib/auth/session';
import { getTeacherQuestions, type QuestionType } from '@/services/questions';
import { redirect } from 'next/navigation';
import { QuestionList } from './QuestionList';
import { QuestionToolbar } from './QuestionToolbar';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TeacherQuestionsPage({ searchParams }: Props) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') redirect('/login');

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const type = params.type as QuestionType | undefined;
  const difficulty = params.difficulty ? Number(params.difficulty) : undefined;
  const search = typeof params.search === 'string' ? params.search : undefined;

  const { questions, total } = await getTeacherQuestions(profile.id, {
    page,
    type,
    difficulty,
    search,
    limit: 20,
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold text-white">Ngân hàng câu hỏi</h1>
      <QuestionToolbar />
      <QuestionList questions={questions} total={total} page={page} limit={20} />
    </div>
  );
}
