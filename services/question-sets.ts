import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

export type QuestionSetRow = {
  id: string;
  owner_id: string;
  name: string;
  subject: string;
  grade: number | null;
  description: string;
  created_at: string;
  updated_at: string;
  question_count?: number;
};

export type CreateSetData = {
  name: string;
  subject?: string;
  grade?: number | null;
  description?: string;
  question_ids: string[];
};

export async function getTeacherSets(teacherId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('question_sets')
    .select('*, question_set_items(count)')
    .eq('owner_id', teacherId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map((s: Record<string, unknown>) => {
    const items = s.question_set_items as unknown;
    const count = Array.isArray(items) && items.length > 0
      ? (items[0] as { count: number }).count
      : 0;
    return { ...s, question_count: count } as QuestionSetRow;
  });
}

export async function getSetWithQuestions(setId: string, teacherId: string) {
  const admin = createAdminClient();
  const { data: set, error } = await admin
    .from('question_sets')
    .select('*')
    .eq('id', setId)
    .eq('owner_id', teacherId)
    .single();
  if (error) throw new Error(error.message);

  const { data: items } = await admin
    .from('question_set_items')
    .select('question_id, sort_order, questions(id, type, content, options, skill_tags, difficulty, explanation)')
    .eq('set_id', setId)
    .order('sort_order');

  const questions = (items ?? []).map((item: Record<string, unknown>) => {
    const q = item.questions as Record<string, unknown>;
    return { ...q, sort_order: item.sort_order };
  });

  return { set, questions };
}

export async function createQuestionSet(teacherId: string, data: CreateSetData) {
  const admin = createAdminClient();

  const { data: set, error } = await admin
    .from('question_sets')
    .insert({
      owner_id: teacherId,
      name: data.name,
      subject: data.subject ?? '',
      grade: data.grade ?? null,
      description: data.description ?? '',
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  if (data.question_ids.length > 0) {
    const items = data.question_ids.map((qId, i) => ({
      set_id: set.id,
      question_id: qId,
      sort_order: i,
    }));
    const { error: itemErr } = await admin.from('question_set_items').insert(items);
    if (itemErr) throw new Error(itemErr.message);
  }

  return set.id as string;
}

export async function deleteQuestionSet(setId: string, teacherId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('question_sets')
    .delete()
    .eq('id', setId)
    .eq('owner_id', teacherId);
  if (error) throw new Error(error.message);
}

export async function getSetQuestionIds(setId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('question_set_items')
    .select('question_id')
    .eq('set_id', setId)
    .order('sort_order');
  if (error) throw new Error(error.message);
  return (data ?? []).map((item: { question_id: string }) => item.question_id);
}
