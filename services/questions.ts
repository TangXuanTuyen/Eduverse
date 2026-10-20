import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

export type QuestionType = 'single_choice' | 'multiple_choice' | 'short_answer' | 'essay';

export type QuestionRow = {
  id: string;
  type: QuestionType;
  content: string;
  options: { id: string; text: string }[] | null;
  skill_tags: string[];
  difficulty: number;
  explanation: string;
  created_at: string;
  updated_at: string;
};

export type QuestionWithAnswer = QuestionRow & {
  correct_answer: unknown;
};

type QuestionFilters = {
  type?: QuestionType;
  difficulty?: number;
  skill?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export async function getTeacherQuestions(teacherId: string, filters: QuestionFilters = {}) {
  const admin = createAdminClient();
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const from = (page - 1) * limit;

  let query = admin
    .from('questions')
    .select('*', { count: 'exact' })
    .eq('owner_id', teacherId)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  if (filters.type) query = query.eq('type', filters.type);
  if (filters.difficulty) query = query.eq('difficulty', filters.difficulty);
  if (filters.skill) query = query.contains('skill_tags', [filters.skill]);
  if (filters.search) query = query.ilike('content', `%${filters.search}%`);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { questions: data as QuestionRow[], total: count ?? 0 };
}

export async function getQuestion(questionId: string, teacherId: string): Promise<QuestionWithAnswer> {
  const admin = createAdminClient();
  const { data: q, error } = await admin
    .from('questions')
    .select('*')
    .eq('id', questionId)
    .eq('owner_id', teacherId)
    .single();
  if (error) throw new Error(error.message);

  const { data: ans } = await admin
    .from('question_answers')
    .select('correct_answer')
    .eq('question_id', questionId)
    .single();

  return { ...(q as QuestionRow), correct_answer: ans?.correct_answer ?? null };
}

export type CreateQuestionData = {
  type: QuestionType;
  content: string;
  options?: { id: string; text: string }[] | null;
  correct_answer?: unknown;
  skill_tags?: string[];
  difficulty?: number;
  explanation?: string;
};

export async function createQuestion(teacherId: string, data: CreateQuestionData) {
  const admin = createAdminClient();
  const { data: q, error } = await admin
    .from('questions')
    .insert({
      owner_id: teacherId,
      type: data.type,
      content: data.content,
      options: data.options ?? null,
      skill_tags: data.skill_tags ?? [],
      difficulty: data.difficulty ?? 1,
      explanation: data.explanation ?? '',
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  const { error: ansError } = await admin
    .from('question_answers')
    .insert({ question_id: q.id, correct_answer: data.correct_answer ?? null });
  if (ansError) throw new Error(ansError.message);

  return q.id as string;
}

export async function updateQuestion(questionId: string, teacherId: string, data: Partial<CreateQuestionData>) {
  const admin = createAdminClient();
  const updates: Record<string, unknown> = {};
  if (data.type !== undefined) updates.type = data.type;
  if (data.content !== undefined) updates.content = data.content;
  if (data.options !== undefined) updates.options = data.options;
  if (data.skill_tags !== undefined) updates.skill_tags = data.skill_tags;
  if (data.difficulty !== undefined) updates.difficulty = data.difficulty;
  if (data.explanation !== undefined) updates.explanation = data.explanation;

  if (Object.keys(updates).length > 0) {
    const { error } = await admin
      .from('questions')
      .update(updates)
      .eq('id', questionId)
      .eq('owner_id', teacherId);
    if (error) throw new Error(error.message);
  }

  if (data.correct_answer !== undefined) {
    const { error } = await admin
      .from('question_answers')
      .update({ correct_answer: data.correct_answer })
      .eq('question_id', questionId);
    if (error) throw new Error(error.message);
  }
}

export async function deleteQuestion(questionId: string, teacherId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('questions')
    .delete()
    .eq('id', questionId)
    .eq('owner_id', teacherId);
  if (error) throw new Error(error.message);
}

export async function importQuestions(teacherId: string, rows: CreateQuestionData[]) {
  const ids: string[] = [];
  for (const row of rows) {
    const id = await createQuestion(teacherId, row);
    ids.push(id);
  }
  return ids;
}
