import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { checkAndAwardBadges, type BadgeWithStatus } from './badges';

const DAILY_XP_CAP = 300;

export const XP_REWARDS = {
  review_fix: 40,
  game_complete: 20,
  boss_clear: 60,
  perfect_quick: 50,
  daily_login: 10,
  process_complete: 30,
  streak_bonus: 20,
} as const;

export type XpReason = keyof typeof XP_REWARDS;

export function calculateLevel(totalXp: number): {
  level: number;
  xpForNext: number;
  progress: number;
} {
  // Level N requires N*100 cumulative XP
  let level = 1;
  let cumulative = 0;
  while (cumulative + level * 100 <= totalXp) {
    cumulative += level * 100;
    level++;
  }
  const xpInLevel = totalXp - cumulative;
  const xpForNext = level * 100;
  return { level, xpForNext, progress: xpInLevel / xpForNext };
}

async function getOrCreateStats(admin: ReturnType<typeof createAdminClient>, studentId: string) {
  const { data } = await admin
    .from('student_stats')
    .select('*')
    .eq('student_id', studentId)
    .single();

  if (data) return data;

  await admin.from('student_stats').insert({ student_id: studentId });
  const { data: created } = await admin
    .from('student_stats')
    .select('*')
    .eq('student_id', studentId)
    .single();

  return created!;
}

export async function awardXp(
  studentId: string,
  reason: XpReason,
  contextId: string,
  metadata?: Record<string, unknown>,
): Promise<{
  awarded: number;
  capped: boolean;
  totalXp: number;
  level: number;
  newBadges: BadgeWithStatus[];
}> {
  const admin = createAdminClient();
  const amount = XP_REWARDS[reason];
  const idempotencyKey = `${reason}::${contextId}`;

  // Get or create stats
  const stats = await getOrCreateStats(admin, studentId);

  // Reset daily counter if new day
  const today = new Date().toISOString().slice(0, 10);
  const xpToday = stats.xp_today_date === today ? stats.xp_today : 0;
  const remaining = Math.max(0, DAILY_XP_CAP - xpToday);
  const awarded = Math.min(amount, remaining);
  const capped = awarded < amount;

  if (awarded <= 0) {
    return {
      awarded: 0,
      capped: true,
      totalXp: stats.total_xp,
      level: stats.current_level,
      newBadges: [],
    };
  }

  // Insert transaction (idempotent via unique constraint)
  const { error } = await admin.from('xp_transactions').insert({
    student_id: studentId,
    amount: awarded,
    reason,
    idempotency_key: idempotencyKey,
    metadata: metadata ?? {},
  });

  if (error) {
    // Duplicate key = already awarded
    if (error.code === '23505') {
      return {
        awarded: 0,
        capped: false,
        totalXp: stats.total_xp,
        level: stats.current_level,
        newBadges: [],
      };
    }
    throw error;
  }

  // Update stats
  const newTotalXp = stats.total_xp + awarded;
  const { level } = calculateLevel(newTotalXp);

  // Update daily streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let dailyStreak = stats.current_daily_streak;
  if (stats.last_active_date === yesterdayStr) {
    dailyStreak += 1;
  } else if (stats.last_active_date !== today) {
    dailyStreak = 1;
  }

  const updateData: Record<string, unknown> = {
    total_xp: newTotalXp,
    xp_today: xpToday + awarded,
    xp_today_date: today,
    current_level: level,
    last_active_date: today,
    current_daily_streak: dailyStreak,
    longest_daily_streak: Math.max(stats.longest_daily_streak, dailyStreak),
  };

  if (reason === 'review_fix') {
    updateData.reviews_fixed = stats.reviews_fixed + 1;
  }
  if (reason === 'game_complete' || reason === 'boss_clear') {
    updateData.games_completed = stats.games_completed + 1;
  }

  await admin
    .from('student_stats')
    .update(updateData)
    .eq('student_id', studentId);

  // Check badges
  const newBadges = await checkAndAwardBadges(studentId);

  return { awarded, capped, totalXp: newTotalXp, level, newBadges };
}

export async function getXpSummary(studentId: string): Promise<{
  totalXp: number;
  level: number;
  xpForNext: number;
  progress: number;
  xpToday: number;
  dailyCap: number;
  xpThisWeek: number;
  xpLastWeek: number;
  dailyStreak: number;
  recentTransactions: Array<{
    id: string;
    amount: number;
    reason: string;
    createdAt: string;
  }>;
}> {
  const admin = createAdminClient();

  const stats = await getOrCreateStats(admin, studentId);
  const today = new Date().toISOString().slice(0, 10);
  const xpToday = stats.xp_today_date === today ? stats.xp_today : 0;

  const { level, xpForNext, progress } = calculateLevel(stats.total_xp);

  // This week XP
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const { data: thisWeekTx } = await admin
    .from('xp_transactions')
    .select('amount')
    .eq('student_id', studentId)
    .gte('created_at', weekStart.toISOString());

  const xpThisWeek = (thisWeekTx ?? []).reduce((sum, t) => sum + t.amount, 0);

  // Last week XP
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const { data: lastWeekTx } = await admin
    .from('xp_transactions')
    .select('amount')
    .eq('student_id', studentId)
    .gte('created_at', lastWeekStart.toISOString())
    .lt('created_at', weekStart.toISOString());

  const xpLastWeek = (lastWeekTx ?? []).reduce((sum, t) => sum + t.amount, 0);

  // Recent transactions
  const { data: recent } = await admin
    .from('xp_transactions')
    .select('id, amount, reason, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    totalXp: stats.total_xp,
    level,
    xpForNext,
    progress,
    xpToday,
    dailyCap: DAILY_XP_CAP,
    xpThisWeek,
    xpLastWeek,
    dailyStreak: stats.current_daily_streak,
    recentTransactions: (recent ?? []).map((t) => ({
      id: t.id,
      amount: t.amount,
      reason: t.reason,
      createdAt: t.created_at,
    })),
  };
}
