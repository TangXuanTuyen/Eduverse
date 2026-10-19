import type { Metadata } from 'next';
import { BuildingRoute } from '@/components/student/BuildingRoute';

export const metadata: Metadata = { title: 'Thư viện' };

export default function Page() {
  return <BuildingRoute id="library" />;
}
