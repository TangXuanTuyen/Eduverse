import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ParentReportsView } from './ParentReportsView';

export const metadata: Metadata = { title: 'Báo cáo — Phụ huynh' };

export default async function ParentReportsPage() {
  const supabase = await createClient();
  const { data: children } = await supabase.rpc('get_my_children');
  const kids = (children ?? []) as { student_id: string; display_name: string; grade: number | null }[];

  return <ParentReportsView children={kids} />;
}
