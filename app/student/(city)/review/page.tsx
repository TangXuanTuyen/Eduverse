import type { Metadata } from 'next';
import { BuildingRoute } from '@/components/student/BuildingRoute';

export const metadata: Metadata = { title: 'Trạm sửa lỗi' };

export default function Page() {
  return <BuildingRoute id="review_station" />;
}
