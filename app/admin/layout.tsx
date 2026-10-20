import { requireRole } from '@/lib/auth/session';
import { RoleShell } from '@/components/dashboard/RoleShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole('admin');
  return (
    <RoleShell role={profile.role} displayName={profile.displayName}>
      {children}
    </RoleShell>
  );
}
