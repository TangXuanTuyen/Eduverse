import { requireRole } from '@/lib/auth/session';
import { RoleShell } from '@/components/dashboard/RoleShell';

// Kiểm tra vai trò ở server cho mọi trang trong /admin (không chỉ ẩn nút)
export default async function Layout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole('admin');
  return (
    <RoleShell role={profile.role} displayName={profile.displayName}>
      {children}
    </RoleShell>
  );
}
