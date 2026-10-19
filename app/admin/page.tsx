import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Quản trị hệ thống' };

export default async function AdminHome() {
  const supabase = await createClient();
  const { data: schools } = await supabase.from('schools').select('id, name, code').order('name');
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Các trường</h1>
      <ul className="space-y-2">
        {(schools ?? []).map((s) => (
          <li key={s.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between">
            <span>{s.name}</span>
            <span className="font-mono text-slate-400">{s.code}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
