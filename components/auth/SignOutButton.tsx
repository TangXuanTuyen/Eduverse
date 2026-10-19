import { LogOut } from 'lucide-react';

/** Form POST để đăng xuất (không dùng link GET, tránh bị đăng xuất bởi prefetch/CSRF). */
export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action="/auth/dang-xuat" method="post">
      <button
        type="submit"
        className={
          className ??
          'min-h-11 px-4 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2'
        }
      >
        <LogOut className="w-4 h-4" aria-hidden="true" />
        Đăng xuất
      </button>
    </form>
  );
}
