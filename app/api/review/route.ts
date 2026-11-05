import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { getReviewQueue, getReviewStats } from '@/services/review-queue';

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const [items, stats] = await Promise.all([
    getReviewQueue(profile.id),
    getReviewStats(profile.id),
  ]);

  return NextResponse.json({ items, stats });
}
