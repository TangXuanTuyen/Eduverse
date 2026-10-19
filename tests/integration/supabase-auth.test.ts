/**
 * Kiểm thử tích hợp với Supabase thật (gọi REST/Auth API như kẻ tấn công sẽ làm).
 * Tự tạo một trường + tài khoản thử với mã ngẫu nhiên, xóa sạch khi xong.
 * Chạy: npm run test:integration (cần .env.local trỏ tới project DEV).
 */
import { randomBytes } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createStaffOrParentAccount, createStudentAccount, generateTempPassword } from '@/services/accounts-core';
import { studentEmailFromCode } from '@/lib/auth/identifier';
import { authenticate, type LoginDeps } from '@/services/login-core';

try {
  process.loadEnvFile('.env.local');
} catch {}

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const configured = Boolean(URL_ && ANON && SERVICE);

const noSession = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const tag = randomBytes(3).toString('hex').toUpperCase(); // ví dụ "A1B2C3"

describe.skipIf(!configured)('Supabase thật: đăng nhập và phân quyền', () => {
  let admin: SupabaseClient;
  let schoolId = '';
  let classId = '';
  const users: Record<string, { id: string; login: string; password: string }> = {};

  async function signedIn(key: string) {
    const c = createClient(URL_, ANON, noSession);
    const u = users[key];
    const email = u.login.includes('@') ? u.login : studentEmailFromCode(u.login);
    const { error } = await c.auth.signInWithPassword({ email, password: u.password });
    if (error) throw error;
    return c;
  }

  beforeAll(async () => {
    admin = createClient(URL_, SERVICE, noSession);
    const { data: school, error } = await admin
      .from('schools')
      .insert({ name: `Trường kiểm thử ${tag}`, code: `IT${tag}` })
      .select('id')
      .single();
    if (error) throw error;
    schoolId = school.id;

    for (const k of ['A', 'B']) {
      const login = `IT${tag}${k}`;
      const password = generateTempPassword();
      const { userId } = await createStudentAccount(admin, {
        schoolId,
        studentCode: login,
        displayName: `HS thử ${k}`,
        grade: 6,
        tempPassword: password,
      });
      users[k] = { id: userId, login, password };
    }
    {
      const login = `it.parent.${tag.toLowerCase()}@example.com`;
      const password = generateTempPassword(14);
      const { userId } = await createStaffOrParentAccount(admin, {
        email: login,
        role: 'parent',
        schoolId,
        displayName: 'PH thử',
        password,
      });
      users.P = { id: userId, login, password };
    }

    const { data: klass, error: classError } = await admin
      .from('classes')
      .insert({ school_id: schoolId, name: `IT${tag}`, grade: 6, school_year: '2026-2027' })
      .select('id')
      .single();
    if (classError) throw classError;
    classId = klass.id;
    await admin.from('class_members').insert([{ class_id: classId, user_id: users.B.id, member_role: 'student' }]);
    await admin.from('parent_links').insert({ parent_id: users.P.id, student_id: users.A.id, status: 'pending' });
  }, 60_000);

  afterAll(async () => {
    if (!admin) return;
    for (const u of Object.values(users)) await admin.auth.admin.deleteUser(u.id);
    if (classId) await admin.from('classes').delete().eq('id', classId);
    if (schoolId) await admin.from('schools').delete().eq('id', schoolId);
  }, 60_000);

  test('khóa anon không đăng nhập: không đọc được bảng nào, không gọi được RPC', async () => {
    const anon = createClient(URL_, ANON, noSession);
    for (const table of ['schools', 'profiles', 'classes', 'class_members', 'parent_links', 'login_attempts']) {
      const { data, error } = await anon.from(table).select('*').limit(5);
      expect(error ?? (data ?? []).length === 0, `bảng ${table}`).toBeTruthy();
      expect(data ?? []).toEqual([]);
    }
    for (const fn of ['get_my_children', 'app_current_role']) {
      const { data, error } = await anon.rpc(fn);
      expect(error, `rpc ${fn}`).not.toBeNull();
      expect(data).toBeNull();
    }
  });

  test('đăng nhập bằng mã học sinh: lần đầu có cờ bắt đổi mật khẩu', async () => {
    const c = await signedIn('A');
    const { data } = await c.from('profiles').select('student_code, must_change_password, role').single();
    expect(data).toEqual({ student_code: users.A.login, must_change_password: true, role: 'student' });
  });

  test('học sinh A không đọc được hồ sơ, lớp của học sinh B', async () => {
    const c = await signedIn('A');
    const { data: profiles } = await c.from('profiles').select('id');
    expect(profiles?.map((p) => p.id)).toEqual([users.A.id]);
    const { data: other } = await c.from('profiles').select('*').eq('id', users.B.id);
    expect(other).toEqual([]);
    const { data: classes } = await c.from('classes').select('id');
    expect(classes).toEqual([]);
    const { data: roster } = await c.rpc('get_class_roster', { p_class_id: classId });
    expect(roster ?? []).toEqual([]);
  });

  test('không tự nâng vai trò qua REST (update, upsert, RPC nội bộ)', async () => {
    const c = await signedIn('A');
    const update = await c.from('profiles').update({ role: 'admin' }).eq('id', users.A.id).select();
    expect(update.error ?? (update.data ?? []).length === 0).toBeTruthy();
    const upsert = await c.from('profiles').upsert({ id: users.A.id, role: 'admin' }).select();
    expect(upsert.error).not.toBeNull();
    const flag = await c.from('profiles').update({ must_change_password: false }).eq('id', users.A.id).select();
    expect(flag.error ?? (flag.data ?? []).length === 0).toBeTruthy();
    const rpc = await c.rpc('login_clear', { p_key: `id:${'0'.repeat(64)}` });
    expect(rpc.error).not.toBeNull();
    // Metadata tự sửa không có tác dụng
    await c.auth.updateUser({ data: { role: 'admin' } });
    const { data: role } = await c.rpc('app_current_role');
    expect(role).toBe('student');

    const { data: after } = await admin.from('profiles').select('role, must_change_password').eq('id', users.A.id).single();
    expect(after).toEqual({ role: 'student', must_change_password: true });
  });

  test('phụ huynh chưa được duyệt không đọc được dữ liệu của con', async () => {
    const c = await signedIn('P');
    const { data: kids } = await c.rpc('get_my_children');
    expect(kids).toEqual([]);
    const { data: child } = await c.from('profiles').select('*').eq('id', users.A.id);
    expect(child).toEqual([]);
    const { data: links } = await c.from('parent_links').select('status');
    expect(links).toEqual([{ status: 'pending' }]);

    await admin.from('parent_links').update({ status: 'approved' }).eq('parent_id', users.P.id);
    const { data: approved } = await c.rpc('get_my_children');
    expect(approved).toEqual([{ student_id: users.A.id, display_name: 'HS thử A', grade: 6 }]);
  });

  test('sai mật khẩu 5 lần → bị khóa (bộ đếm thật trong CSDL)', async () => {
    const plain = createClient(URL_, ANON, noSession);
    const deps: LoginDeps = {
      async getLockedUntil(key) {
        const { data } = await admin.rpc('login_lock_status', { p_key: key });
        return data ? new Date(data) : null;
      },
      async recordFailure(key, max) {
        const { data } = await admin.rpc('login_record_failure', { p_key: key, p_max_failures: max });
        return data ? new Date(data) : null;
      },
      async clearFailures(key) {
        await admin.rpc('login_clear', { p_key: key });
      },
      async signIn(email, password) {
        const { data, error } = await plain.auth.signInWithPassword({ email, password });
        return error || !data.user ? { ok: false } : { ok: true, userId: data.user.id };
      },
    };
    let last;
    for (let i = 0; i < 5; i++) last = await authenticate({ identifier: users.B.login, password: 'sai-mat-khau', ip: null }, deps);
    expect(last).toMatchObject({ ok: false, reason: 'locked' });
    const correctWhileLocked = await authenticate({ identifier: users.B.login, password: users.B.password, ip: null }, deps);
    expect(correctWhileLocked.ok).toBe(false);
  });
});

test.skipIf(configured)('bỏ qua kiểm thử tích hợp: chưa cấu hình .env.local', () => {});
