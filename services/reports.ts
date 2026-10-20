import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RoomReportRow = {
  room_id: string;
  room_name: string;
  grade: number | null;
  member_count: number;
  assignment_count: number;
  avg_accuracy: number;
  submissions_graded: number;
  submissions_total: number;
};

export type StudentReportRow = {
  student_id: string;
  display_name: string;
  grade: number | null;
  total_xp: number;
  assignments_completed: number;
  avg_score: number;
  last_active_date: string | null;
  days_inactive: number;
  needs_attention: boolean;
};

export type SkillReportRow = {
  skill: string;
  total_attempts: number;
  correct_count: number;
  accuracy: number;
};

export type QuestionReportRow = {
  question_id: string;
  content: string;
  type: string;
  total_attempts: number;
  correct_count: number;
  accuracy: number;
  avg_time_seconds: number | null;
};

export type InactiveStudent = {
  student_id: string;
  display_name: string;
  room_name: string;
  last_active_date: string | null;
  days_inactive: number;
};

export type TimeSavedStats = {
  auto_graded_count: number;
  total_submissions: number;
  ai_drafted_approved: number;
  ai_drafted_total: number;
};

// ---------------------------------------------------------------------------
// Teacher: báo cáo theo phòng
// ---------------------------------------------------------------------------

export async function getRoomReports(teacherId: string): Promise<RoomReportRow[]> {
  const admin = createAdminClient();

  const { data: rooms } = await admin
    .from('rooms')
    .select('id, name, grade')
    .eq('owner_id', teacherId)
    .order('name');

  if (!rooms || rooms.length === 0) return [];

  const roomIds = rooms.map((r) => r.id);

  // Count members
  const { data: members } = await admin
    .from('room_members')
    .select('room_id, user_id')
    .in('room_id', roomIds)
    .eq('is_active', true);

  // Count assignments
  const { data: assignments } = await admin
    .from('assignments')
    .select('id, room_id')
    .in('room_id', roomIds);

  // Get submissions
  const assignmentIds = (assignments ?? []).map((a) => a.id);
  let submissions: Array<{ assignment_id: string; status: string; total_score: number | null; max_score: number | null }> = [];
  if (assignmentIds.length > 0) {
    const { data } = await admin
      .from('submissions')
      .select('assignment_id, status, total_score, max_score')
      .in('assignment_id', assignmentIds);
    submissions = (data ?? []) as typeof submissions;
  }

  // Build assignment→room map
  const assignRoomMap = new Map<string, string>();
  for (const a of assignments ?? []) {
    assignRoomMap.set(a.id, a.room_id);
  }

  // Aggregate
  const memberCount = new Map<string, number>();
  for (const m of members ?? []) {
    memberCount.set(m.room_id, (memberCount.get(m.room_id) ?? 0) + 1);
  }

  const assignCount = new Map<string, number>();
  for (const a of assignments ?? []) {
    assignCount.set(a.room_id, (assignCount.get(a.room_id) ?? 0) + 1);
  }

  const roomStats = new Map<string, { graded: number; total: number; scoreSum: number; maxSum: number }>();
  for (const s of submissions) {
    const rid = assignRoomMap.get(s.assignment_id);
    if (!rid) continue;
    const stat = roomStats.get(rid) ?? { graded: 0, total: 0, scoreSum: 0, maxSum: 0 };
    stat.total++;
    if (s.status === 'graded' || s.status === 'published') {
      stat.graded++;
      stat.scoreSum += Number(s.total_score) || 0;
      stat.maxSum += Number(s.max_score) || 0;
    }
    roomStats.set(rid, stat);
  }

  return rooms.map((r) => {
    const stat = roomStats.get(r.id);
    return {
      room_id: r.id,
      room_name: r.name,
      grade: r.grade,
      member_count: memberCount.get(r.id) ?? 0,
      assignment_count: assignCount.get(r.id) ?? 0,
      avg_accuracy: stat && stat.maxSum > 0 ? Math.round((stat.scoreSum / stat.maxSum) * 100) : 0,
      submissions_graded: stat?.graded ?? 0,
      submissions_total: stat?.total ?? 0,
    };
  });
}

// ---------------------------------------------------------------------------
// Teacher: báo cáo theo học sinh
// ---------------------------------------------------------------------------

export async function getStudentReports(teacherId: string, roomId?: string): Promise<StudentReportRow[]> {
  const admin = createAdminClient();

  // Get rooms teacher owns
  let roomQuery = admin.from('rooms').select('id').eq('owner_id', teacherId);
  if (roomId) roomQuery = roomQuery.eq('id', roomId);
  const { data: rooms } = await roomQuery;
  const roomIds = (rooms ?? []).map((r) => r.id);
  if (roomIds.length === 0) return [];

  // Get members (students only)
  const { data: members } = await admin
    .from('room_members')
    .select('room_id, user_id, profiles!inner(display_name, grade, role)')
    .in('room_id', roomIds)
    .eq('is_active', true);

  const students = (members ?? []).filter(
    (m) => (m.profiles as unknown as { role: string })?.role === 'student'
  );
  const studentIds = students.map((s) => s.user_id);
  if (studentIds.length === 0) return [];

  // Get student_stats
  const { data: stats } = await admin
    .from('student_stats')
    .select('student_id, total_xp, last_active_date')
    .in('student_id', studentIds);

  const statsMap = new Map<string, { total_xp: number; last_active_date: string | null }>();
  for (const s of stats ?? []) {
    statsMap.set(s.student_id, { total_xp: s.total_xp, last_active_date: s.last_active_date });
  }

  // Get submissions
  const { data: assignments } = await admin
    .from('assignments')
    .select('id')
    .in('room_id', roomIds);
  const assignmentIds = (assignments ?? []).map((a) => a.id);

  const subMap = new Map<string, { count: number; scoreSum: number; maxSum: number }>();
  if (assignmentIds.length > 0) {
    const { data: subs } = await admin
      .from('submissions')
      .select('student_id, total_score, max_score, status')
      .in('assignment_id', assignmentIds)
      .in('status', ['graded', 'published']);

    for (const s of subs ?? []) {
      const entry = subMap.get(s.student_id) ?? { count: 0, scoreSum: 0, maxSum: 0 };
      entry.count++;
      entry.scoreSum += Number(s.total_score) || 0;
      entry.maxSum += Number(s.max_score) || 0;
      subMap.set(s.student_id, entry);
    }
  }

  const today = new Date();
  return students.map((m) => {
    const profile = m.profiles as unknown as { display_name: string; grade: number | null };
    const stat = statsMap.get(m.user_id);
    const sub = subMap.get(m.user_id);
    const lastActive = stat?.last_active_date;
    const daysInactive = lastActive
      ? Math.floor((today.getTime() - new Date(lastActive).getTime()) / 86_400_000)
      : 999;

    return {
      student_id: m.user_id,
      display_name: profile.display_name,
      grade: profile.grade,
      total_xp: stat?.total_xp ?? 0,
      assignments_completed: sub?.count ?? 0,
      avg_score: sub && sub.maxSum > 0 ? Math.round((sub.scoreSum / sub.maxSum) * 100) : 0,
      last_active_date: lastActive ?? null,
      days_inactive: daysInactive,
      needs_attention: daysInactive >= 7 || (sub?.count === 0 && assignmentIds.length > 0),
    };
  });
}

// ---------------------------------------------------------------------------
// Teacher: báo cáo theo kỹ năng (skill_tags)
// ---------------------------------------------------------------------------

export async function getSkillReports(teacherId: string, roomId?: string): Promise<SkillReportRow[]> {
  const admin = createAdminClient();

  let roomQuery = admin.from('rooms').select('id').eq('owner_id', teacherId);
  if (roomId) roomQuery = roomQuery.eq('id', roomId);
  const { data: rooms } = await roomQuery;
  const roomIds = (rooms ?? []).map((r) => r.id);
  if (roomIds.length === 0) return [];

  const { data: assignments } = await admin
    .from('assignments')
    .select('id')
    .in('room_id', roomIds);
  const assignmentIds = (assignments ?? []).map((a) => a.id);
  if (assignmentIds.length === 0) return [];

  const { data: aqs } = await admin
    .from('assignment_questions')
    .select('id, source_question_id')
    .in('assignment_id', assignmentIds);

  const sourceIds = new Set<string>();
  for (const aq of aqs ?? []) {
    if (aq.source_question_id) sourceIds.add(aq.source_question_id);
  }
  if (sourceIds.size === 0) return [];

  const { data: questions } = await admin
    .from('questions')
    .select('id, skill_tags')
    .in('id', Array.from(sourceIds));

  const questionTagMap = new Map<string, string[]>();
  for (const q of questions ?? []) {
    questionTagMap.set(q.id, q.skill_tags as string[]);
  }

  const aqIds = (aqs ?? []).map((a) => a.id);
  const aqSourceMap = new Map<string, string>();
  for (const aq of aqs ?? []) {
    if (aq.source_question_id) aqSourceMap.set(aq.id, aq.source_question_id);
  }

  const { data: attempts } = await admin
    .from('question_attempts')
    .select('assignment_question_id, is_correct')
    .in('assignment_question_id', aqIds);

  const skillMap = new Map<string, { total: number; correct: number }>();
  for (const a of attempts ?? []) {
    const sourceId = aqSourceMap.get(a.assignment_question_id);
    const tags = sourceId ? questionTagMap.get(sourceId) ?? [] : [];
    for (const tag of tags) {
      const entry = skillMap.get(tag) ?? { total: 0, correct: 0 };
      entry.total++;
      if (a.is_correct) entry.correct++;
      skillMap.set(tag, entry);
    }
  }

  return Array.from(skillMap.entries())
    .map(([skill, s]) => ({
      skill,
      total_attempts: s.total,
      correct_count: s.correct,
      accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);
}

// ---------------------------------------------------------------------------
// Teacher: báo cáo theo câu hỏi
// ---------------------------------------------------------------------------

export async function getQuestionReports(teacherId: string, roomId?: string): Promise<QuestionReportRow[]> {
  const admin = createAdminClient();

  let roomQuery = admin.from('rooms').select('id').eq('owner_id', teacherId);
  if (roomId) roomQuery = roomQuery.eq('id', roomId);
  const { data: rooms } = await roomQuery;
  const roomIds = (rooms ?? []).map((r) => r.id);
  if (roomIds.length === 0) return [];

  const { data: assignments } = await admin
    .from('assignments')
    .select('id')
    .in('room_id', roomIds);
  const assignmentIds = (assignments ?? []).map((a) => a.id);
  if (assignmentIds.length === 0) return [];

  const { data: aqs } = await admin
    .from('assignment_questions')
    .select('id, content, type')
    .in('assignment_id', assignmentIds);

  const aqIds = (aqs ?? []).map((a) => a.id);
  if (aqIds.length === 0) return [];

  const { data: attempts } = await admin
    .from('question_attempts')
    .select('assignment_question_id, is_correct, time_spent_seconds')
    .in('assignment_question_id', aqIds);

  const statsMap = new Map<string, { total: number; correct: number; timeSum: number; timeCount: number }>();
  for (const a of attempts ?? []) {
    const entry = statsMap.get(a.assignment_question_id) ?? { total: 0, correct: 0, timeSum: 0, timeCount: 0 };
    entry.total++;
    if (a.is_correct) entry.correct++;
    if (a.time_spent_seconds != null) {
      entry.timeSum += a.time_spent_seconds;
      entry.timeCount++;
    }
    statsMap.set(a.assignment_question_id, entry);
  }

  return (aqs ?? []).map((q) => {
    const s = statsMap.get(q.id) ?? { total: 0, correct: 0, timeSum: 0, timeCount: 0 };
    return {
      question_id: q.id,
      content: q.content,
      type: q.type,
      total_attempts: s.total,
      correct_count: s.correct,
      accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
      avg_time_seconds: s.timeCount > 0 ? Math.round(s.timeSum / s.timeCount) : null,
    };
  }).sort((a, b) => a.accuracy - b.accuracy);
}

// ---------------------------------------------------------------------------
// Teacher: học sinh không hoạt động
// ---------------------------------------------------------------------------

export async function getInactiveStudents(teacherId: string, daysThreshold = 7): Promise<InactiveStudent[]> {
  const admin = createAdminClient();

  const { data: rooms } = await admin
    .from('rooms')
    .select('id, name')
    .eq('owner_id', teacherId);
  const roomIds = (rooms ?? []).map((r) => r.id);
  if (roomIds.length === 0) return [];

  const { data: members } = await admin
    .from('room_members')
    .select('room_id, user_id, profiles!inner(display_name, role)')
    .in('room_id', roomIds)
    .eq('is_active', true);

  const students = (members ?? []).filter(
    (m) => (m.profiles as unknown as { role: string })?.role === 'student'
  );
  const studentIds = students.map((s) => s.user_id);
  if (studentIds.length === 0) return [];

  const { data: stats } = await admin
    .from('student_stats')
    .select('student_id, last_active_date')
    .in('student_id', studentIds);

  const statsMap = new Map<string, string | null>();
  for (const s of stats ?? []) {
    statsMap.set(s.student_id, s.last_active_date);
  }

  const roomMap = new Map<string, string>();
  for (const r of rooms ?? []) {
    roomMap.set(r.id, r.name);
  }

  const today = new Date();
  const result: InactiveStudent[] = [];
  for (const m of students) {
    const lastActive = statsMap.get(m.user_id) ?? null;
    const daysInactive = lastActive
      ? Math.floor((today.getTime() - new Date(lastActive).getTime()) / 86_400_000)
      : 999;
    if (daysInactive >= daysThreshold) {
      result.push({
        student_id: m.user_id,
        display_name: (m.profiles as unknown as { display_name: string }).display_name,
        room_name: roomMap.get(m.room_id) ?? '',
        last_active_date: lastActive,
        days_inactive: daysInactive,
      });
    }
  }

  return result.sort((a, b) => b.days_inactive - a.days_inactive);
}

// ---------------------------------------------------------------------------
// Teacher: thống kê thời gian tiết kiệm
// ---------------------------------------------------------------------------

export async function getTimeSavedStats(teacherId: string): Promise<TimeSavedStats> {
  const admin = createAdminClient();

  const { data: rooms } = await admin
    .from('rooms')
    .select('id')
    .eq('owner_id', teacherId);
  const roomIds = (rooms ?? []).map((r) => r.id);
  if (roomIds.length === 0) {
    return { auto_graded_count: 0, total_submissions: 0, ai_drafted_approved: 0, ai_drafted_total: 0 };
  }

  const { data: assignments } = await admin
    .from('assignments')
    .select('id')
    .in('room_id', roomIds);
  const assignmentIds = (assignments ?? []).map((a) => a.id);
  if (assignmentIds.length === 0) {
    return { auto_graded_count: 0, total_submissions: 0, ai_drafted_approved: 0, ai_drafted_total: 0 };
  }

  // Count auto-graded (single_choice, multiple_choice questions)
  const { data: aqs } = await admin
    .from('assignment_questions')
    .select('id, type')
    .in('assignment_id', assignmentIds);

  const autoGradableIds = (aqs ?? [])
    .filter((q) => q.type === 'single_choice' || q.type === 'multiple_choice')
    .map((q) => q.id);

  let autoGraded = 0;
  if (autoGradableIds.length > 0) {
    const { count } = await admin
      .from('question_attempts')
      .select('*', { count: 'exact', head: true })
      .in('assignment_question_id', autoGradableIds)
      .not('is_correct', 'is', null);
    autoGraded = count ?? 0;
  }

  const { count: totalSubs } = await admin
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .in('assignment_id', assignmentIds)
    .in('status', ['submitted', 'graded', 'published']);

  // AI drafted questions: questions created via AI generate
  const { data: aiQuestions } = await admin
    .from('questions')
    .select('id')
    .eq('owner_id', teacherId);

  // No AI metadata column yet, so we return 0 for now
  return {
    auto_graded_count: autoGraded,
    total_submissions: totalSubs ?? 0,
    ai_drafted_approved: 0,
    ai_drafted_total: 0,
  };
}

// ---------------------------------------------------------------------------
// Audit logging
// ---------------------------------------------------------------------------

export async function createAuditLog(
  actorId: string,
  action: string,
  targetType: 'student' | 'room' | 'assignment' | 'report',
  targetId: string,
  metadata: Record<string, unknown> = {},
  ipAddress?: string
) {
  const admin = createAdminClient();
  await admin.rpc('create_audit_log', {
    p_actor_id: actorId,
    p_action: action,
    p_target_type: targetType,
    p_target_id: targetId,
    p_metadata: metadata,
    p_ip: ipAddress ?? null,
  });
}

// ---------------------------------------------------------------------------
// Parent: tóm tắt tuần
// ---------------------------------------------------------------------------

export type WeeklySummaryData = {
  student_id: string;
  display_name: string;
  week_start: string;
  summary_text: string;
  stats: {
    xp_earned: number;
    assignments_completed: number;
    assignments_total: number;
    avg_score: number;
    games_played: number;
    reviews_fixed: number;
    badges_earned: string[];
  };
  suggestions: string[];
  missing_assignments: Array<{ title: string; due_at: string | null }>;
  published_results: Array<{
    title: string;
    score: number | null;
    max_score: number | null;
    feedback: string | null;
  }>;
};

export async function getWeeklySummary(
  parentId: string,
  studentId: string,
  weekStart?: Date
): Promise<WeeklySummaryData | null> {
  const admin = createAdminClient();

  // Verify parent-child link
  const { data: link } = await admin
    .from('parent_links')
    .select('id')
    .eq('parent_id', parentId)
    .eq('student_id', studentId)
    .eq('status', 'approved')
    .maybeSingle();

  if (!link) return null;

  // Get student profile
  const { data: profile } = await admin
    .from('profiles')
    .select('display_name')
    .eq('id', studentId)
    .single();

  if (!profile) return null;

  // Calculate week boundaries
  const now = weekStart ?? new Date();
  const monday = new Date(now);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 7);

  const weekStartStr = monday.toISOString().slice(0, 10);

  // XP this week
  const { data: xpData } = await admin
    .from('xp_transactions')
    .select('amount')
    .eq('student_id', studentId)
    .gte('created_at', monday.toISOString())
    .lt('created_at', sunday.toISOString());

  const xpEarned = (xpData ?? []).reduce((sum, t) => sum + t.amount, 0);

  // Get rooms student is in
  const { data: memberships } = await admin
    .from('room_members')
    .select('room_id')
    .eq('user_id', studentId)
    .eq('is_active', true);
  const roomIds = (memberships ?? []).map((m) => m.room_id);

  // Assignments in those rooms
  let assignmentsCompleted = 0;
  let assignmentsTotal = 0;
  let scoreSum = 0;
  let maxSum = 0;
  const missingAssignments: Array<{ title: string; due_at: string | null }> = [];
  const publishedResults: Array<{
    title: string;
    score: number | null;
    max_score: number | null;
    feedback: string | null;
  }> = [];

  if (roomIds.length > 0) {
    const { data: assignments } = await admin
      .from('assignments')
      .select('id, title, due_at, results_published')
      .in('room_id', roomIds);

    const assignmentIds = (assignments ?? []).map((a) => a.id);
    assignmentsTotal = assignmentIds.length;

    if (assignmentIds.length > 0) {
      type SubRow = {
        assignment_id: string;
        status: string;
        total_score: number | null;
        max_score: number | null;
        published_at: string | null;
      };
      const { data: subs } = await admin
        .from('submissions')
        .select('assignment_id, status, total_score, max_score, published_at')
        .eq('student_id', studentId)
        .in('assignment_id', assignmentIds);

      const subMap = new Map<string, SubRow>();
      for (const s of (subs ?? []) as unknown as SubRow[]) {
        subMap.set(s.assignment_id, s);
      }

      for (const a of assignments ?? []) {
        const sub = subMap.get(a.id);
        if (sub && (sub.status === 'graded' || sub.status === 'published')) {
          assignmentsCompleted++;
          scoreSum += Number(sub.total_score) || 0;
          maxSum += Number(sub.max_score) || 0;
        }

        // Missing: no submission or still draft
        if (!sub || sub.status === 'draft') {
          missingAssignments.push({ title: a.title, due_at: a.due_at });
        }

        // Published results
        if (sub && sub.published_at && a.results_published) {
          publishedResults.push({
            title: a.title,
            score: sub.total_score != null ? Number(sub.total_score) : null,
            max_score: sub.max_score != null ? Number(sub.max_score) : null,
            feedback: null,
          });
        }
      }
    }
  }

  // Games this week
  const { data: gamePlayers } = await admin
    .from('game_players')
    .select('id, session_id')
    .eq('user_id', studentId);

  let gamesPlayed = 0;
  if (gamePlayers && gamePlayers.length > 0) {
    const sessionIds = gamePlayers.map((p) => p.session_id);
    const { count } = await admin
      .from('game_sessions')
      .select('*', { count: 'exact', head: true })
      .in('id', sessionIds)
      .eq('status', 'finished')
      .gte('started_at', monday.toISOString())
      .lt('started_at', sunday.toISOString());
    gamesPlayed = count ?? 0;
  }

  // Reviews fixed this week
  const { data: reviews } = await admin
    .from('review_queue')
    .select('id')
    .eq('student_id', studentId)
    .gte('last_reviewed_at', monday.toISOString())
    .lt('last_reviewed_at', sunday.toISOString())
    .gt('correct_streak', 0);
  const reviewsFixed = reviews?.length ?? 0;

  // Badges earned this week
  const { data: badgeAwards } = await admin
    .from('badge_awards')
    .select('badge_id')
    .eq('student_id', studentId)
    .gte('awarded_at', monday.toISOString())
    .lt('awarded_at', sunday.toISOString());
  const badgesEarned = (badgeAwards ?? []).map((b) => b.badge_id);

  const avgScore = maxSum > 0 ? Math.round((scoreSum / maxSum) * 100) : 0;

  // Generate summary text from data (no AI)
  const summaryParts: string[] = [];
  if (xpEarned > 0) {
    summaryParts.push(`Tuần này ${profile.display_name} đã kiếm được ${xpEarned} XP.`);
  } else {
    summaryParts.push(`Tuần này ${profile.display_name} chưa hoạt động nhiều.`);
  }

  if (assignmentsCompleted > 0) {
    summaryParts.push(
      `Đã hoàn thành ${assignmentsCompleted}/${assignmentsTotal} bài giao` +
      (avgScore > 0 ? ` với điểm trung bình ${avgScore}%.` : '.')
    );
  }

  if (gamesPlayed > 0) {
    summaryParts.push(`Đã chơi ${gamesPlayed} trò chơi ôn tập.`);
  }

  if (reviewsFixed > 0) {
    summaryParts.push(`Đã sửa được ${reviewsFixed} câu sai qua ôn tập ngắt quãng.`);
  }

  if (badgesEarned.length > 0) {
    summaryParts.push(`Đạt ${badgesEarned.length} huy hiệu mới!`);
  }

  if (missingAssignments.length > 0) {
    summaryParts.push(`Còn ${missingAssignments.length} bài chưa hoàn thành.`);
  }

  // Suggestions
  const suggestions: string[] = [];
  if (missingAssignments.length > 0) {
    suggestions.push('Hỏi con: "Bài giao tuần này con đã làm xong chưa?"');
  }
  if (xpEarned === 0) {
    suggestions.push('Hỏi con: "Tuần này con có vào EDUVERSE học không? Cần ba/mẹ giúp gì không?"');
  }
  if (reviewsFixed > 0) {
    suggestions.push('Khen con: "Con sửa được nhiều câu sai, tốt lắm! Con thấy phần nào khó nhất?"');
  }
  if (avgScore >= 80) {
    suggestions.push('Khen con: "Điểm trung bình tuần này tốt quá! Con thích học phần nào nhất?"');
  } else if (avgScore > 0 && avgScore < 50) {
    suggestions.push('Hỏi con: "Tuần này con thấy phần nào khó? Để ba/mẹ nhờ thầy/cô hỗ trợ thêm nhé."');
  }
  if (gamesPlayed > 0) {
    suggestions.push('Hỏi con: "Con chơi trò ôn tập có vui không? Học được gì mới không?"');
  }

  return {
    student_id: studentId,
    display_name: profile.display_name,
    week_start: weekStartStr,
    summary_text: summaryParts.join(' '),
    stats: {
      xp_earned: xpEarned,
      assignments_completed: assignmentsCompleted,
      assignments_total: assignmentsTotal,
      avg_score: avgScore,
      games_played: gamesPlayed,
      reviews_fixed: reviewsFixed,
      badges_earned: badgesEarned,
    },
    missing_assignments: missingAssignments,
    published_results: publishedResults,
    suggestions,
  };
}

// ---------------------------------------------------------------------------
// Parent: lấy tiến bộ so với chính con (theo tuần)
// ---------------------------------------------------------------------------

export type ProgressTrend = {
  week_start: string;
  xp: number;
  avg_score: number;
  assignments_done: number;
};

export async function getProgressTrend(
  parentId: string,
  studentId: string,
  weeks = 8
): Promise<ProgressTrend[]> {
  const admin = createAdminClient();

  // Verify link
  const { data: link } = await admin
    .from('parent_links')
    .select('id')
    .eq('parent_id', parentId)
    .eq('student_id', studentId)
    .eq('status', 'approved')
    .maybeSingle();

  if (!link) return [];

  // Get XP by week
  const { data: xpData } = await admin
    .from('xp_transactions')
    .select('amount, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  // Group by week
  const weekMap = new Map<string, { xp: number; scoreSum: number; maxSum: number; done: number }>();
  const now = new Date();

  for (let i = 0; i < weeks; i++) {
    const start = new Date(now);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - i * 7);
    start.setHours(0, 0, 0, 0);
    weekMap.set(start.toISOString().slice(0, 10), { xp: 0, scoreSum: 0, maxSum: 0, done: 0 });
  }

  for (const t of xpData ?? []) {
    const d = new Date(t.created_at);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    const entry = weekMap.get(key);
    if (entry) entry.xp += t.amount;
  }

  return Array.from(weekMap.entries())
    .map(([week, data]) => ({
      week_start: week,
      xp: data.xp,
      avg_score: data.maxSum > 0 ? Math.round((data.scoreSum / data.maxSum) * 100) : 0,
      assignments_done: data.done,
    }))
    .sort((a, b) => a.week_start.localeCompare(b.week_start));
}
