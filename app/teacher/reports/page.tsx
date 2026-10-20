import type { Metadata } from 'next';
import { TeacherReportsView } from './TeacherReportsView';

export const metadata: Metadata = { title: 'Báo cáo — Giáo viên' };

export default function TeacherReportsPage() {
  return <TeacherReportsView />;
}
