import { requireRole } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { StudentGameProvider } from '@/components/student/StudentGameProvider';
import { CityShell } from '@/components/student/CityShell';

// Layout giữ nguyên khi chuyển giữa các địa điểm → bản đồ không bị tải lại, vị trí nhân vật giữ nguyên
export default async function StudentCityLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole('student');
  const supabase = await createClient();
  // RLS: học sinh chỉ thấy lớp của mình
  const { data: classes } = await supabase.from('classes').select('name').order('school_year', { ascending: false }).limit(1);
  const className = classes?.[0]?.name ? `Lớp ${classes[0].name}` : '';

  return (
    <StudentGameProvider identity={{ userId: profile.id, displayName: profile.displayName, className }}>
      <CityShell>{children}</CityShell>
    </StudentGameProvider>
  );
}
