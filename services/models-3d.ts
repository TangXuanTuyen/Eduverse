import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

export type Model3DRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  subject: string;
  grade_level: number;
  thumbnail_url: string | null;
  embed_url: string;
  embed_type: string;
  is_published: boolean;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type Filters = { subject?: string; grade_level?: number; category?: string };

export async function getAllPublishedModels(filters?: Filters) {
  const admin = createAdminClient();
  let query = admin
    .from('models_3d')
    .select('*')
    .eq('is_published', true)
    .order('sort_order')
    .order('created_at', { ascending: false });

  if (filters?.subject) query = query.eq('subject', filters.subject);
  if (filters?.grade_level) query = query.eq('grade_level', filters.grade_level);
  if (filters?.category) query = query.eq('category', filters.category);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as Model3DRow[];
}

export async function getAllModels() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('models_3d')
    .select('*')
    .order('sort_order')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Model3DRow[];
}

export async function getModelDetail(id: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('models_3d').select('*').eq('id', id).single();
  if (error || !data) throw new Error('Không tìm thấy mô hình');
  return data as Model3DRow;
}

export type CreateModelData = {
  title: string;
  description?: string;
  category?: string;
  subject: string;
  grade_level: number;
  thumbnail_url?: string;
  embed_url: string;
  embed_type?: string;
};

export async function createModel(adminId: string, data: CreateModelData) {
  const admin = createAdminClient();
  const { data: model, error } = await admin
    .from('models_3d')
    .insert({
      title: data.title,
      description: data.description ?? '',
      category: data.category ?? 'khac',
      subject: data.subject,
      grade_level: data.grade_level,
      thumbnail_url: data.thumbnail_url ?? null,
      embed_url: data.embed_url,
      embed_type: data.embed_type ?? 'iframe',
      is_published: false,
      created_by: adminId,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return model.id as string;
}

export async function updateModel(id: string, data: Partial<CreateModelData>) {
  const admin = createAdminClient();
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.subject !== undefined) updateData.subject = data.subject;
  if (data.grade_level !== undefined) updateData.grade_level = data.grade_level;
  if (data.thumbnail_url !== undefined) updateData.thumbnail_url = data.thumbnail_url;
  if (data.embed_url !== undefined) updateData.embed_url = data.embed_url;
  if (data.embed_type !== undefined) updateData.embed_type = data.embed_type;

  const { error } = await admin.from('models_3d').update(updateData).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function toggleModelPublish(id: string) {
  const admin = createAdminClient();
  const { data: m } = await admin.from('models_3d').select('is_published').eq('id', id).single();
  if (!m) throw new Error('Không tìm thấy');

  const { error } = await admin
    .from('models_3d')
    .update({ is_published: !m.is_published, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  return !m.is_published;
}

export async function deleteModel(id: string) {
  const admin = createAdminClient();
  const { error } = await admin.from('models_3d').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function assignModel(teacherId: string, modelId: string, roomId: string, dueAt?: string) {
  const admin = createAdminClient();
  const { data: room } = await admin.from('rooms').select('id').eq('id', roomId).eq('owner_id', teacherId).single();
  if (!room) throw new Error('Không tìm thấy lớp');

  const { error } = await admin
    .from('model_assignments')
    .upsert(
      { model_id: modelId, room_id: roomId, assigned_by: teacherId, due_at: dueAt ?? null },
      { onConflict: 'model_id,room_id' }
    );
  if (error) throw new Error(error.message);
}

export async function recordModelView(userId: string, modelId: string) {
  const admin = createAdminClient();
  await admin.from('model_views').upsert(
    { model_id: modelId, user_id: userId, viewed_at: new Date().toISOString() },
    { onConflict: 'model_id,user_id' }
  );
}
