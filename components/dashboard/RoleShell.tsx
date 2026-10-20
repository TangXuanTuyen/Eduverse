import Link from 'next/link';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { ROLE_LABEL, type AppRole } from '@/lib/auth/roles';

const TEACHER_NAV = [
  { href: '/teacher/rooms', label: 'Phòng học' },
  { href: '/teacher/questions', label: 'Ngân hàng câu hỏi' },
  { href: '/teacher/assignments', label: 'Bài giao' },
];

/** Khung trang cho giáo viên / phụ huynh / quản trị (bản tối giản, sẽ thay bằng shadcn/ui ở bước sau). */
export function RoleShell({
  role,
  displayName,
  children,
}: {
  role: AppRole;
  displayName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-bold text-white">EDUVERSE</div>
            <div className="text-xs text-slate-400 truncate">
              {ROLE_LABEL[role]} · {displayName || 'Chưa đặt tên'}
            </div>
          </div>
          <SignOutButton />
        </div>
        {role === 'teacher' && (
          <nav className="max-w-5xl mx-auto px-4 flex gap-1 pt-2">
            {TEACHER_NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg min-h-[44px] flex items-center"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-400 bg-slate-900 border border-slate-800 rounded-xl p-4">{children}</p>;
}
