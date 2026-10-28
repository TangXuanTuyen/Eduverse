'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { ROLE_LABEL, type AppRole } from '@/lib/auth/roles';
import {
  Home,
  HelpCircle,
  ClipboardList,
  Gamepad2,
  FlaskConical,
  Wrench,
  Box,
  BookOpen,
  CheckSquare,
  BarChart3,
  Users,
  Sparkles,
} from 'lucide-react';

const PARENT_NAV = [
  { href: '/parent', label: 'Tổng quan', icon: Home },
  { href: '/parent/reports', label: 'Báo cáo tuần', icon: BarChart3 },
];

const ADMIN_NAV = [
  { href: '/admin/experiments', label: 'Thí nghiệm', icon: FlaskConical },
  { href: '/admin/models', label: 'Mô hình 3D', icon: Box },
  { href: '/admin/lessons', label: 'Bài học', icon: BookOpen },
];

const TEACHER_NAV = [
  { href: '/teacher/rooms', label: 'Phòng học', icon: Users },
  { href: '/teacher/questions', label: 'Ngân hàng câu hỏi', icon: HelpCircle },
  { href: '/teacher/assignments', label: 'Bài giao', icon: ClipboardList },
  { href: '/teacher/games', label: 'Xưởng trò chơi', icon: Gamepad2 },
  { href: '/teacher/stem-maker', label: 'STEM Maker', icon: Wrench },
  { href: '/teacher/labs', label: 'Thí nghiệm', icon: FlaskConical },
  { href: '/teacher/models', label: 'Mô hình 3D', icon: Box },
  { href: '/teacher/lessons', label: 'Bài học', icon: BookOpen },
  { href: '/teacher/grading', label: 'Chấm bài', icon: CheckSquare },
  { href: '/teacher/reports', label: 'Báo cáo', icon: BarChart3 },
];

function NavLink({ href, label, icon: Icon, isActive }: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; isActive: boolean }) {
  return (
    <Link
      href={href}
      className={`
        group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium
        min-h-[44px] transition-all duration-200
        ${isActive
          ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white shadow-sm shadow-indigo-500/10'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
        }
      `}
    >
      <Icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
      <span className="truncate">{label}</span>
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-indigo-400" />
      )}
    </Link>
  );
}

function NavBar({ items }: { items: typeof TEACHER_NAV }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {items.map((n) => (
        <NavLink
          key={n.href}
          href={n.href}
          label={n.label}
          icon={n.icon}
          isActive={pathname === n.href || pathname.startsWith(n.href + '/')}
        />
      ))}
    </nav>
  );
}

function getNavItems(role: AppRole) {
  switch (role) {
    case 'teacher': return TEACHER_NAV;
    case 'admin': return ADMIN_NAV;
    case 'parent': return PARENT_NAV;
    default: return [];
  }
}

export function RoleShell({
  role,
  displayName,
  children,
}: {
  role: AppRole;
  displayName: string;
  children: React.ReactNode;
}) {
  const navItems = getNavItems(role);

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-56 lg:w-64 flex-col border-r border-slate-800/60 bg-slate-900/50 backdrop-blur-sm sticky top-0 h-dvh">
        {/* Logo */}
        <div className="px-4 pt-5 pb-4">
          <Link href={`/${role}`} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm text-white tracking-wide">EDUVERSE</div>
              <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{ROLE_LABEL[role]}</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-2">
          <NavBar items={navItems} />
        </div>

        {/* User footer */}
        <div className="border-t border-slate-800/60 p-3">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow">
              {(displayName || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white truncate">{displayName || 'Chưa đặt tên'}</div>
              <div className="text-[11px] text-slate-500">{ROLE_LABEL[role]}</div>
            </div>
          </div>
          <SignOutButton className="w-full mt-1 min-h-10 px-3 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors" />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden border-b border-slate-800/60 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm text-white">EDUVERSE</span>
            </div>
            <SignOutButton className="min-h-10 px-3 rounded-lg text-sm text-slate-400 hover:text-white flex items-center gap-1.5" />
          </div>
          {/* Mobile nav scroll */}
          <nav className="px-3 pb-2 flex gap-1 overflow-x-auto scrollbar-none">
            {navItems.map((n) => {
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className="shrink-0 px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-lg min-h-[44px] flex items-center gap-1.5 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
        <BookOpen className="w-8 h-8 text-slate-600" />
      </div>
      <p className="text-sm text-slate-400 text-center max-w-sm">{children}</p>
    </div>
  );
}
