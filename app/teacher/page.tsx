import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { EmptyNote } from '@/components/dashboard/RoleShell';

export const metadata: Metadata = { title: 'Tổng quan giáo viên' };

export default async function TeacherHome() {
  const supabase = await createClient();
  // RLS: giáo viên chỉ thấy lớp mình dạy
  const { data: classes } = await supabase.from('classes').select('id, name, grade, school_year').order('name');
  const rosters = await Promise.all(
    (classes ?? []).map(async (c) => {
      const { data } = await supabase.rpc('get_class_roster', { p_class_id: c.id });
      return { ...c, students: (data ?? []) as { user_id: string; display_name: string; student_code: string }[] };
    })
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Lớp của tôi</h1>
      {rosters.length === 0 && <EmptyNote>Thầy/cô chưa được phân công lớp nào.</EmptyNote>}
      {rosters.map((c) => (
        <section key={c.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="font-semibold">
            Lớp {c.name} · Khối {c.grade} · {c.school_year}
          </h2>
          <p className="text-xs text-slate-400 mb-3">{c.students.length} học sinh</p>
          <ul className="grid sm:grid-cols-2 gap-2 text-sm">
            {c.students.map((s) => (
              <li key={s.user_id} className="bg-slate-800/60 rounded-lg px-3 py-2 flex justify-between gap-2">
                <span>{s.display_name}</span>
                <span className="font-mono text-slate-400">{s.student_code}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
