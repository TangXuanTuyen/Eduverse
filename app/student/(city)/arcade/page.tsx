import type { Metadata } from 'next';
import { BuildingRoute } from '@/components/student/BuildingRoute';

export const metadata: Metadata = { title: 'Quiz Arcade' };

export default function Page() {
  return <BuildingRoute id="quiz_arcade" />;
}
