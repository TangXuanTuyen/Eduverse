import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const assignmentId = req.nextUrl.searchParams.get('assignmentId');
  if (!assignmentId) {
    return NextResponse.json({ error: 'Missing assignmentId' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: assignment } = await admin
    .from('assignments')
    .select('id, room_id, assignment_type')
    .eq('id', assignmentId)
    .single();

  if (!assignment) {
    return NextResponse.json({ error: 'Không tìm thấy bài tập' }, { status: 404 });
  }

  const { data: member } = await admin
    .from('room_members')
    .select('room_id')
    .eq('room_id', assignment.room_id)
    .eq('user_id', profile.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ error: 'Bạn không thuộc lớp này' }, { status: 403 });
  }

  const { data: questions } = await admin
    .from('assignment_questions')
    .select('id, sort_order, type, content, options, explanation, points')
    .eq('assignment_id', assignmentId)
    .order('sort_order');

  const questionIds = (questions ?? []).map((q) => q.id);
  const { data: answers } = await admin
    .from('question_answers')
    .select('question_id, correct_answer')
    .in('question_id', questionIds.length > 0 ? questionIds : ['_none_']);

  const answerMap = new Map(
    (answers ?? []).map((a: Record<string, unknown>) => [a.question_id, a.correct_answer])
  );

  const formatted = (questions ?? []).map((q) => {
    const opts = Array.isArray(q.options) ? q.options : [];
    const correctAnswer = answerMap.get(q.id);
    let correctIndex = 0;
    if (typeof correctAnswer === 'number') {
      correctIndex = correctAnswer;
    } else if (typeof correctAnswer === 'string') {
      const idx = opts.findIndex((o: { text?: string; id?: string }) => o.text === correctAnswer || o.id === correctAnswer);
      correctIndex = idx >= 0 ? idx : 0;
    }

    return {
      id: q.id,
      question_text: q.content,
      options: opts.map((o: { text: string }) => o.text),
      correct_index: correctIndex,
      explanation: q.explanation ?? '',
      skill_tags: q.type ?? 'KHTN',
    };
  });

  return NextResponse.json({ questions: formatted });
}
