import { StudentGameProvider } from '@/components/student/StudentGameProvider';
import { CityShell } from '@/components/student/CityShell';

// Layout giữ nguyên khi chuyển giữa các địa điểm → bản đồ không bị tải lại, vị trí nhân vật giữ nguyên
export default function StudentCityLayout({ children }: { children: React.ReactNode }) {
  return (
    <StudentGameProvider>
      <CityShell>{children}</CityShell>
    </StudentGameProvider>
  );
}
