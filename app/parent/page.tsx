import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { EmptyNote } from '@/components/dashboard/RoleShell';

export const metadata: Metadata = { title: 'Tổng quan phụ huynh' };

export default async function ParentHome() {
  const supabase = await createClient();
  const [{ data: children }, { data: links }] = await Promise.all([
    supabase.rpc('get_my_children'),
    supabase.from('parent_links').select('id, status'),
  ]);
  const kids = (children ?? []) as { student_id: string; display_name: string; grade: number | null }[];
  const pending = (links ?? []).filter((l) => l.status === 'pending').length;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Con của tôi</h1>
      {pending > 0 && (
        <EmptyNote>Có {pending} yêu cầu liên kết đang chờ nhà trường duyệt.</EmptyNote>
      )}
      {kids.length === 0 ? (
        <EmptyNote>Chưa có liên kết nào được duyệt.</EmptyNote>
      ) : (
        <ul className="space-y-2">
          {kids.map((k) => (
            <li key={k.student_id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="font-semibold">{k.display_name}</div>
              {k.grade && <div className="text-xs text-slate-400">Khối {k.grade}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
