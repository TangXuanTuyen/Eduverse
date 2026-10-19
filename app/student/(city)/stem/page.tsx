import type { Metadata } from 'next';
import { BuildingRoute } from '@/components/student/BuildingRoute';

export const metadata: Metadata = { title: 'Phòng STEM' };

export default function Page() {
  return <BuildingRoute id="stem_lab" />;
}
