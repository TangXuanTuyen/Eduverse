import { getCurrentProfile } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { StemMakerList } from './StemMakerList';

export default async function StemMakerPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') redirect('/login');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">STEM Maker</h1>
        <p className="text-sm text-slate-400 mt-1">
          Dự án STEM tương tác cho học sinh THCS — giao bài tập hoặc mở tại lớp
        </p>
      </div>
      <StemMakerList teacherId={profile.id} />
    </div>
  );
}
