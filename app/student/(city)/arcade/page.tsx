import type { Metadata } from 'next';
import { BuildingRoute } from '@/components/student/BuildingRoute';

export const metadata: Metadata = { title: 'Quiz Arcade' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ assignment?: string }>;
}) {
  const { assignment } = await searchParams;
  return <BuildingRoute id="quiz_arcade" assignmentId={assignment} />;
}
