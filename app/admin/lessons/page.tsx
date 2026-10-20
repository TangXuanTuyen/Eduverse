import { requireRole } from '@/lib/auth/session';
import { getAllLessons } from '@/services/lessons';
import { LessonAdminList } from './LessonAdminList';
import { CreateLessonForm } from './CreateLessonForm';

export const metadata = { title: 'Quản lý bài học · Admin' };

export default async function Page() {
  await requireRole('admin');
  const lessons = await getAllLessons();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Bài học trực quan</h1>
        <CreateLessonForm />
      </div>
      <LessonAdminList lessons={lessons} />
    </div>
  );
}
