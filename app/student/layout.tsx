import { requireRole } from '@/lib/auth/session';

// Kiểm tra vai trò ở server cho mọi trang trong /student
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await requireRole('student');
  return children;
}
