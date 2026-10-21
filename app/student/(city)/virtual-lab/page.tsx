import type { Metadata } from 'next';
import { BuildingRoute } from '@/components/student/BuildingRoute';

export const metadata: Metadata = { title: 'Phòng Thí Nghiệm Ảo' };

export default function Page() {
  return <BuildingRoute id="virtual_lab" />;
}
