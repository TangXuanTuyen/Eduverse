import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

export type QuestionStat = {
  question_id: string;
  content: string;
  type: string;
  total_attempts: number;
  correct_count: number;
  accuracy: number;
};

export type StudentStat = {
  student_id: string;
  display_name: string;
  submissions_count: number;
  avg_score: number;
  total_score: number;
  max_possible: number;
};

export async function getQuestionStats(assignmentId: string) {
  const admin = createAdminClient();

  const { data: aqs } = await admin
    .from('assignment_questions')
    .select('id, content, type')
    .eq('assignment_id', assignmentId)
    .order('sort_order');

  if (!aqs || aqs.length === 0) return [];

  const { data: attempts } = await admin
    .from('question_attempts')
    .select('assignment_question_id, is_correct, submissions!inner(assignment_id)')
    .eq('submissions.assignment_id', assignmentId);

  const statsMap = new Map<string, { total: number; correct: number }>();
  for (const a of attempts ?? []) {
    const aqId = (a as Record<string, unknown>).assignment_question_id as string;
    const entry = statsMap.get(aqId) ?? { total: 0, correct: 0 };
    entry.total++;
    if ((a as Record<string, unknown>).is_correct === true) entry.correct++;
    statsMap.set(aqId, entry);
  }

  return aqs.map((q: Record<string, unknown>) => {
    const s = statsMap.get(q.id as string) ?? { total: 0, correct: 0 };
    return {
      question_id: q.id,
      content: q.content,
      type: q.type,
      total_attempts: s.total,
      correct_count: s.correct,
      accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
    };
  }) as QuestionStat[];
}

export async function getStudentStats(roomId: string) {
  const admin = createAdminClient();

  // Get all members
  const { data: members } = await admin
    .from('room_members')
    .select('user_id, profiles!inner(display_name)')
    .eq('room_id', roomId)
    .eq('is_active', true);

  // Get assignments in this room
  const { data: assignments } = await admin
    .from('assignments')
    .select('id')
    .eq('room_id', roomId);
  const assignmentIds = (assignments ?? []).map((a: Record<string, unknown>) => a.id as string);
  if (assignmentIds.length === 0) {
    return (members ?? []).map((m: Record<string, unknown>) => ({
      student_id: m.user_id,
      display_name: ((m.profiles as Record<string, unknown>)?.display_name ?? '') as string,
      submissions_count: 0,
      avg_score: 0,
      total_score: 0,
      max_possible: 0,
    })) as StudentStat[];
  }

  // Get submissions
  const { data: subs } = await admin
    .from('submissions')
    .select('student_id, total_score, max_score, status')
    .in('assignment_id', assignmentIds)
    .in('status', ['graded', 'published']);

  const subMap = new Map<string, { count: number; total: number; max: number }>();
  for (const s of subs ?? []) {
    const sid = (s as Record<string, unknown>).student_id as string;
    const entry = subMap.get(sid) ?? { count: 0, total: 0, max: 0 };
    entry.count++;
    entry.total += Number((s as Record<string, unknown>).total_score) || 0;
    entry.max += Number((s as Record<string, unknown>).max_score) || 0;
    subMap.set(sid, entry);
  }

  return (members ?? []).map((m: Record<string, unknown>) => {
    const uid = m.user_id as string;
    const s = subMap.get(uid) ?? { count: 0, total: 0, max: 0 };
    return {
      student_id: uid,
      display_name: ((m.profiles as Record<string, unknown>)?.display_name ?? '') as string,
      submissions_count: s.count,
      avg_score: s.count > 0 ? Math.round((s.total / s.max) * 100) : 0,
      total_score: s.total,
      max_possible: s.max,
    };
  }) as StudentStat[];
}

export async function getSkillStats(teacherId: string) {
  const admin = createAdminClient();

  // Get all questions by this teacher that have been used in assignments
  const { data: aqs } = await admin
    .from('assignment_questions')
    .select('id, type, correct_answer, assignments!inner(room_id, rooms!inner(owner_id))')
    .eq('assignments.rooms.owner_id', teacherId);

  // Get source questions for skill_tags
  const sourceIds = new Set<string>();
  const { data: aqsFull } = await admin
    .from('assignment_questions')
    .select('id, source_question_id')
    .in('id', (aqs ?? []).map((a: Record<string, unknown>) => a.id as string));

  for (const aq of aqsFull ?? []) {
    const sid = (aq as Record<string, unknown>).source_question_id;
    if (sid) sourceIds.add(sid as string);
  }

  const { data: questions } = await admin
    .from('questions')
    .select('id, skill_tags')
    .in('id', Array.from(sourceIds));

  const questionTagMap = new Map<string, string[]>();
  for (const q of questions ?? []) {
    questionTagMap.set((q as Record<string, unknown>).id as string, (q as Record<string, unknown>).skill_tags as string[]);
  }

  // Get attempts
  const aqIds = (aqs ?? []).map((a: Record<string, unknown>) => a.id as string);
  if (aqIds.length === 0) return [];

  const { data: attempts } = await admin
    .from('question_attempts')
    .select('assignment_question_id, is_correct')
    .in('assignment_question_id', aqIds);

  // Map aq → source question
  const aqSourceMap = new Map<string, string>();
  for (const aq of aqsFull ?? []) {
    const sid = (aq as Record<string, unknown>).source_question_id;
    if (sid) aqSourceMap.set((aq as Record<string, unknown>).id as string, sid as string);
  }

  // Aggregate by skill
  const skillMap = new Map<string, { total: number; correct: number }>();
  for (const a of attempts ?? []) {
    const aqId = (a as Record<string, unknown>).assignment_question_id as string;
    const sourceId = aqSourceMap.get(aqId);
    const tags = sourceId ? questionTagMap.get(sourceId) ?? [] : [];
    for (const tag of tags) {
      const entry = skillMap.get(tag) ?? { total: 0, correct: 0 };
      entry.total++;
      if ((a as Record<string, unknown>).is_correct === true) entry.correct++;
      skillMap.set(tag, entry);
    }
  }

  return Array.from(skillMap.entries()).map(([skill, s]) => ({
    skill,
    total: s.total,
    correct: s.correct,
    accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
  }));
}
