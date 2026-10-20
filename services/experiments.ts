import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

export type ExperimentRow = {
  id: string;
  title: string;
  description: string;
  subject: 'vat_ly' | 'hoa_hoc' | 'sinh_hoc' | 'khtn_chung';
  grade_level: number;
  thumbnail_url: string | null;
  embed_url: string | null;
  component_key: string | null;
  duration_minutes: number;
  difficulty: number;
  is_published: boolean;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ExperimentStepRow = {
  id: string;
  experiment_id: string;
  step_number: number;
  title: string;
  instruction: string;
  image_url: string | null;
};

type Filters = {
  subject?: string;
  grade_level?: number;
};

export async function getAllPublishedExperiments(filters?: Filters) {
  const admin = createAdminClient();
  let query = admin
    .from('experiments')
    .select('*')
    .eq('is_published', true)
    .order('sort_order')
    .order('created_at', { ascending: false });

  if (filters?.subject) query = query.eq('subject', filters.subject);
  if (filters?.grade_level) query = query.eq('grade_level', filters.grade_level);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as ExperimentRow[];
}

export async function getAllExperiments() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('experiments')
    .select('*')
    .order('sort_order')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as ExperimentRow[];
}

export async function getExperimentDetail(id: string) {
  const admin = createAdminClient();

  const { data: experiment, error } = await admin
    .from('experiments')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !experiment) throw new Error('Không tìm thấy thí nghiệm');

  const { data: steps } = await admin
    .from('experiment_steps')
    .select('*')
    .eq('experiment_id', id)
    .order('step_number');

  return {
    experiment: experiment as ExperimentRow,
    steps: (steps ?? []) as ExperimentStepRow[],
  };
}

export type CreateExperimentData = {
  title: string;
  description?: string;
  subject: string;
  grade_level: number;
  thumbnail_url?: string;
  embed_url?: string;
  component_key?: string;
  duration_minutes?: number;
  difficulty?: number;
  steps?: { title: string; instruction: string; image_url?: string }[];
};

export async function createExperiment(adminId: string, data: CreateExperimentData) {
  const admin = createAdminClient();

  const { data: experiment, error } = await admin
    .from('experiments')
    .insert({
      title: data.title,
      description: data.description ?? '',
      subject: data.subject,
      grade_level: data.grade_level,
      thumbnail_url: data.thumbnail_url ?? null,
      embed_url: data.embed_url ?? null,
      component_key: data.component_key ?? null,
      duration_minutes: data.duration_minutes ?? 15,
      difficulty: data.difficulty ?? 1,
      is_published: false,
      created_by: adminId,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  if (data.steps?.length) {
    const stepRows = data.steps.map((s, i) => ({
      experiment_id: experiment.id,
      step_number: i + 1,
      title: s.title,
      instruction: s.instruction,
      image_url: s.image_url ?? null,
    }));
    await admin.from('experiment_steps').insert(stepRows);
  }

  return experiment.id as string;
}

export async function updateExperiment(
  id: string,
  data: Partial<Omit<CreateExperimentData, 'steps'>>
) {
  const admin = createAdminClient();
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.subject !== undefined) updateData.subject = data.subject;
  if (data.grade_level !== undefined) updateData.grade_level = data.grade_level;
  if (data.thumbnail_url !== undefined) updateData.thumbnail_url = data.thumbnail_url;
  if (data.embed_url !== undefined) updateData.embed_url = data.embed_url;
  if (data.component_key !== undefined) updateData.component_key = data.component_key;
  if (data.duration_minutes !== undefined) updateData.duration_minutes = data.duration_minutes;
  if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;

  const { error } = await admin.from('experiments').update(updateData).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function togglePublish(id: string) {
  const admin = createAdminClient();
  const { data: exp } = await admin.from('experiments').select('is_published').eq('id', id).single();
  if (!exp) throw new Error('Không tìm thấy');

  const { error } = await admin
    .from('experiments')
    .update({ is_published: !exp.is_published, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  return !exp.is_published;
}

export async function deleteExperiment(id: string) {
  const admin = createAdminClient();
  const { error } = await admin.from('experiments').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
