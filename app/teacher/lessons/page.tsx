import { requireRole } from '@/lib/auth/session';
import { getPublishedLessons } from '@/services/lessons';
import { LessonCatalog } from './LessonCatalog';

export const metadata = { title: 'Bài học · Giáo viên' };

export default async function Page() {
  await requireRole('teacher');
  const lessons = await getPublishedLessons();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Bài học trực quan</h1>
      <LessonCatalog lessons={lessons} />
    </div>
  );
}
