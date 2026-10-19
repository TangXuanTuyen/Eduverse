import type { Metadata } from 'next';
import { BuildingRoute } from '@/components/student/BuildingRoute';

export const metadata: Metadata = { title: 'Thành tích' };

export default function Page() {
  return <BuildingRoute id="achievement_plaza" />;
}
