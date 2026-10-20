import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { getXpSummary } from '@/services/xp';
import { getStudentBadges } from '@/services/badges';

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const [summary, badges] = await Promise.all([
    getXpSummary(profile.id),
    getStudentBadges(profile.id),
  ]);

  return NextResponse.json({
    xp: {
      totalXp: summary.totalXp,
      level: summary.level,
      xpToday: summary.xpToday,
      dailyCap: summary.dailyCap,
      xpThisWeek: summary.xpThisWeek,
      xpLastWeek: summary.xpLastWeek,
      currentStreak: summary.dailyStreak,
      longestStreak: summary.dailyStreak,
    },
    badges,
  });
}
