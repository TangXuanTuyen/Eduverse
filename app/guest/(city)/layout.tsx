import { StudentGameProvider } from '@/components/student/StudentGameProvider';
import { CityShell } from '@/components/student/CityShell';

export const metadata = { title: 'EDUVERSE — Học tự do' };

export default function GuestCityLayout({ children }: { children: React.ReactNode }) {
  return (
    <StudentGameProvider
      identity={{ userId: 'guest', displayName: 'Khách', className: 'Học tự do' }}
      guest
    >
      <CityShell>{children}</CityShell>
    </StudentGameProvider>
  );
}
