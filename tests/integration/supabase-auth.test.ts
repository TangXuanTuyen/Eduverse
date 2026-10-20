/**
 * Kiểm thử tích hợp với Supabase thật — Google OAuth + Room system.
 * Tạo tài khoản thử, phòng, kiểm tra RLS qua REST API.
 * Chạy: npm run test:integration (cần .env.local trỏ tới project DEV).
 */
import { randomBytes } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

try {
  process.loadEnvFile('.env.local');
} catch {}

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const configured = Boolean(URL_ && ANON && SERVICE);

const noSession = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const tag = randomBytes(3).toString('hex').toUpperCase();

describe.skipIf(!configured)('Supabase thật: phòng học và phân quyền', () => {
  let admin: SupabaseClient;
  let roomId = '';
  let joinCode = '';
  const users: Record<string, { id: string; email: string; password: string }> = {};

  async function signedIn(key: string) {
    const c = createClient(URL_, ANON, noSession);
    const { error } = await c.auth.signInWithPassword({ email: users[key].email, password: users[key].password });
    if (error) throw error;
    return c;
  }

  beforeAll(async () => {
    admin = createClient(URL_, SERVICE, noSession);

    // Tạo 2 học sinh + 1 giáo viên + 1 phụ huynh
    for (const [key, role, name] of [
      ['T', 'teacher', `GV thử ${tag}`],
      ['A', 'student', `HS thử A ${tag}`],
      ['B', 'student', `HS thử B ${tag}`],
      ['P', 'parent', `PH thử ${tag}`],
    ] as const) {
      const email = `it.${key.toLowerCase()}.${tag.toLowerCase()}@example.com`;
      const password = 'TestPass' + randomBytes(4).toString('hex');
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name },
      });
      if (error) throw error;
      await admin.from('profiles').update({ role, display_name: name, grade: role === 'student' ? 6 : null }).eq('id', data.user.id);
      users[key] = { id: data.user.id, email, password };
    }

    // Tạo phòng
    const { data: code } = await admin.rpc('generate_join_code');
    joinCode = code;
    const { data: room, error: roomError } = await admin
      .from('rooms')
      .insert({ name: `IT ${tag}`, grade: 6, owner_id: users.T.id, join_code: joinCode })
      .select('id')
      .single();
    if (roomError) throw roomError;
    roomId = room.id;

    // Thêm teacher + student A
    await admin.from('room_members').insert([
      { room_id: roomId, user_id: users.T.id },
      { room_id: roomId, user_id: users.A.id },
    ]);

    // Parent link
    await admin.from('parent_links').insert({ parent_id: users.P.id, student_id: users.A.id, status: 'pending' });
  }, 60_000);

  afterAll(async () => {
    if (!admin) return;
    if (roomId) await admin.from('rooms').delete().eq('id', roomId);
    for (const u of Object.values(users)) await admin.auth.admin.deleteUser(u.id);
  }, 60_000);

  test('anon không đọc được bảng nào', async () => {
    const anon = createClient(URL_, ANON, noSession);
    for (const table of ['profiles', 'rooms', 'room_members', 'parent_links', 'notifications', 'login_attempts']) {
      const { data, error } = await anon.from(table).select('*').limit(5);
      expect(error ?? (data ?? []).length === 0, `bảng ${table}`).toBeTruthy();
    }
  });

  test('học sinh A không đọc được hồ sơ học sinh B (khác phòng)', async () => {
    const c = await signedIn('A');
    const { data: profiles } = await c.from('profiles').select('id');
    const profileIds = (profiles ?? []).map((p) => p.id);
    expect(profileIds).toContain(users.A.id);
    expect(profileIds).not.toContain(users.B.id);
  });

  test('học sinh B join_room bằng mã đúng', async () => {
    const c = await signedIn('B');
    const { data, error } = await c.rpc('join_room', { p_code: joinCode });
    expect(error).toBeNull();
    expect(data).toBe(roomId);
  });

  test('không tự nâng vai trò', async () => {
    const c = await signedIn('A');
    const update = await c.from('profiles').update({ role: 'teacher' }).eq('id', users.A.id).select();
    expect(update.error ?? (update.data ?? []).length === 0).toBeTruthy();

    const { data: role } = await c.rpc('app_current_role');
    expect(role).toBe('student');
  });

  test('phụ huynh chưa duyệt không thấy con', async () => {
    const c = await signedIn('P');
    const { data: kids } = await c.rpc('get_my_children');
    expect(kids).toEqual([]);

    await admin.from('parent_links').update({ status: 'approved' }).eq('parent_id', users.P.id);
    const { data: approved } = await c.rpc('get_my_children');
    expect(approved).toHaveLength(1);
  });
});

test.skipIf(configured)('bỏ qua kiểm thử tích hợp: chưa cấu hình .env.local', () => {});
