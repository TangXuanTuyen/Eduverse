import { getCurrentProfile } from '@/lib/auth/session';
import { getTeacherQuestions, type QuestionType } from '@/services/questions';
import { redirect } from 'next/navigation';
import { QuestionList } from './QuestionList';
import { QuestionToolbar } from './QuestionToolbar';
import { getLocale } from '@/lib/i18n/server';
import { translate } from '@/lib/i18n/dict';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TeacherQuestionsPage({ searchParams }: Props) {
  const locale = await getLocale();
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{translate(locale, 'qs.title')}</h1>
        <p className="text-sm text-slate-400 mt-1">{total} {translate(locale, 'qs.unit')}</p>
      </div>
      <QuestionToolbar />
      <QuestionList questions={questions} total={total} page={page} limit={20} />
    </div>
  );
}
