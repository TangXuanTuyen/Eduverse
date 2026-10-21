import type { Metadata } from 'next';
import { BuildingRoute } from '@/components/student/BuildingRoute';

export const metadata: Metadata = { title: 'Thế Giới 3D' };

export default function Page() {
  return <BuildingRoute id="world_3d" />;
}
