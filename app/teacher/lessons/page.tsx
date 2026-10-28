import { requireRole } from '@/lib/auth/session';
import { getPublishedLessons } from '@/services/lessons';
import { LessonCatalog } from './LessonCatalog';
import { getLocale } from '@/lib/i18n/server';
import { translate } from '@/lib/i18n/dict';

export const metadata = { title: 'Bài học · Giáo viên' };

export default async function Page() {
  const locale = await getLocale();
  await requireRole('teacher');
  const lessons = await getPublishedLessons();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{translate(locale, 'lesson.title')}</h1>
      <LessonCatalog lessons={lessons} />
    </div>
  );
}
