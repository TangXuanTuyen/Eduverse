import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ROLE_LABEL, isAppRole } from '@/lib/auth/roles';

export const metadata: Metadata = { title: 'Quản trị nhà trường' };

export default async function SchoolAdminHome() {
  const supabase = await createClient();
  // RLS: quản trị trường chỉ thấy dữ liệu trường mình
  const [{ data: school }, { data: profiles }, { data: classes }, { data: links }] = await Promise.all([
    supabase.from('schools').select('name, code').maybeSingle(),
    supabase.from('profiles').select('role'),
    supabase.from('classes').select('id, name, school_year').order('name'),
    supabase.from('parent_links').select('status'),
  ]);

  const counts = new Map<string, number>();
  for (const p of profiles ?? []) {
    const key = isAppRole(p.role) ? ROLE_LABEL[p.role] : 'Chưa có vai trò';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const pendingLinks = (links ?? []).filter((l) => l.status === 'pending').length;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">{school?.name ?? 'Trường của tôi'}</h1>
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...counts.entries()].map(([label, n]) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-2xl font-bold">{n}</div>
            <div className="text-xs text-slate-400">{label}</div>
          </div>
        ))}
      </section>
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h2 className="font-semibold mb-2">Lớp học</h2>
        <ul className="text-sm space-y-1">
          {(classes ?? []).map((c) => (
            <li key={c.id}>
              {c.name} · {c.school_year}
            </li>
          ))}
        </ul>
      </section>
      <p className="text-sm text-slate-400">Liên kết phụ huynh chờ duyệt: {pendingLinks}</p>
    </div>
  );
}
