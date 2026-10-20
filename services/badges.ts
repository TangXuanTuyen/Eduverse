import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

export type BadgeWithStatus = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  unlocked: boolean;
  awardedAt: string | null;
};

export async function getStudentBadges(studentId: string): Promise<BadgeWithStatus[]> {
  const admin = createAdminClient();

  const { data: badges } = await admin
    .from('badges')
    .select('*')
    .order('sort_order');

  const { data: awards } = await admin
    .from('badge_awards')
    .select('badge_id, awarded_at')
    .eq('student_id', studentId);

  const awardMap = new Map((awards ?? []).map((a) => [a.badge_id, a.awarded_at]));

  return (badges ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    icon: b.icon,
    category: b.category,
    xpReward: b.xp_reward,
    unlocked: awardMap.has(b.id),
    awardedAt: awardMap.get(b.id) ?? null,
  }));
}

type CriteriaKey =
  | 'games_completed'
  | 'reviews_fixed'
  | 'daily_streak'
  | 'level'
  | 'bosses_cleared'
  | 'perfect_quick_challenges';

export async function checkAndAwardBadges(studentId: string): Promise<BadgeWithStatus[]> {
  const admin = createAdminClient();

  const { data: stats } = await admin
    .from('student_stats')
    .select('*')
    .eq('student_id', studentId)
    .single();

  if (!stats) return [];

  const { data: badges } = await admin
    .from('badges')
    .select('*')
    .order('sort_order');

  const { data: existing } = await admin
    .from('badge_awards')
    .select('badge_id')
    .eq('student_id', studentId);

  const existingIds = new Set((existing ?? []).map((e) => e.badge_id));
  const newBadges: BadgeWithStatus[] = [];

  const statsMap: Record<CriteriaKey, number> = {
    games_completed: stats.games_completed,
    reviews_fixed: stats.reviews_fixed,
    daily_streak: stats.current_daily_streak,
    level: stats.current_level,
    bosses_cleared: 0, // tracked separately if needed
    perfect_quick_challenges: 0, // tracked via metadata
  };

  for (const badge of badges ?? []) {
    if (existingIds.has(badge.id)) continue;

    const criteria = badge.criteria as Record<string, number>;
    const met = Object.entries(criteria).every(
      ([key, threshold]) => (statsMap[key as CriteriaKey] ?? 0) >= threshold,
    );

    if (met) {
      await admin.from('badge_awards').insert({
        student_id: studentId,
        badge_id: badge.id,
      });

      newBadges.push({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        xpReward: badge.xp_reward,
        unlocked: true,
        awardedAt: new Date().toISOString(),
      });
    }
  }

  return newBadges;
}
