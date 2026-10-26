import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

export type StudentProgressRow = {
  user_id: string;
  level: number;
  current_xp: number;
  total_xp: number;
  quizzes_completed: number;
  high_score: number;
  experiments_completed: string[];
};

export async function getStudentProgress(userId: string): Promise<StudentProgressRow | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('student_progress')
    .select('user_id, level, current_xp, total_xp, quizzes_completed, high_score, experiments_completed')
    .eq('user_id', userId)
    .single();
  return data as StudentProgressRow | null;
}

export async function saveStudentProgress(
  userId: string,
  progress: {
    level: number;
    currentXP: number;
    totalXP: number;
    quizzesCompleted: number;
    highScore: number;
    experimentsCompleted: string[];
  }
) {
  const supabase = createAdminClient();
  const { error } = await supabase.rpc('upsert_student_progress', {
    p_user_id: userId,
    p_level: progress.level,
    p_current_xp: progress.currentXP,
    p_total_xp: progress.totalXP,
    p_quizzes_completed: progress.quizzesCompleted,
    p_high_score: progress.highScore,
    p_experiments_completed: progress.experimentsCompleted,
  });
  if (error) throw error;
}

export type LeaderboardEntry = {
  user_id: string;
  display_name: string;
  level: number;
  total_xp: number;
  rank: number;
};

export async function getClassLeaderboard(roomId: string, userId: string): Promise<LeaderboardEntry[]> {
  const supabase = createAdminClient();
  // Verify user is member of the room
  const { data: membership } = await supabase
    .from('room_members')
    .select('user_id')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (!membership) return [];

  const { data } = await supabase
    .from('student_progress')
    .select(`
      user_id,
      level,
      total_xp,
      profiles!inner(display_name)
    `)
    .in('user_id',
      (await supabase
        .from('room_members')
        .select('user_id')
        .eq('room_id', roomId)
        .eq('is_active', true)
      ).data?.map(m => m.user_id) ?? []
    )
    .order('total_xp', { ascending: false })
    .limit(50);

  if (!data) return [];

  return data.map((row: Record<string, unknown>, i: number) => ({
    user_id: row.user_id as string,
    display_name: (row.profiles as Record<string, unknown>)?.display_name as string ?? '',
    level: row.level as number,
    total_xp: row.total_xp as number,
    rank: i + 1,
  }));
}
