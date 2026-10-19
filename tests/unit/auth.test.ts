import { describe, expect, test } from 'vitest';
import { parseLoginIdentifier, studentEmailFromCode } from '@/lib/auth/identifier';
import { canAssignRole, canResetStudentPassword, homeForRole } from '@/lib/auth/roles';
import { changePasswordSchema, newPasswordSchema } from '@/lib/auth/password';
import { generateTempPassword } from '@/services/accounts-core';
import { authenticate, hashKey, type LoginDeps } from '@/services/login-core';

describe('Ô "Mã học sinh hoặc email"', () => {
  test('mã học sinh → email nội bộ, không phân biệt hoa thường/khoảng trắng', () => {
    expect(parseLoginIdentifier(' edu6a101 ')).toEqual({
      kind: 'student',
      studentCode: 'EDU6A101',
      email: 'edu6a101@hs.eduverse.local',
    });
    expect(studentEmailFromCode('EDU 6A1 01')).toBe('edu6a101@hs.eduverse.local');
  });

  test('email thường giữ nguyên (chữ thường)', () => {
    expect(parseLoginIdentifier('GV.Lan@Example.com')).toEqual({ kind: 'email', email: 'gv.lan@example.com' });
  });

  test('gõ thẳng email nội bộ vẫn là đăng nhập học sinh', () => {
    expect(parseLoginIdentifier('edu6a101@hs.eduverse.local')?.kind).toBe('student');
  });

  test.each(['', 'ab', 'mã có dấu', 'abc@', "x' or 1=1 --", 'A'.repeat(21)])('từ chối định danh sai: %j', (v) => {
    expect(parseLoginIdentifier(v)).toBeNull();
  });
});

describe('Trang chủ theo vai trò', () => {
  test('mỗi vai trò về đúng khu vực; chưa có vai trò → trang chưa cấp quyền', () => {
    expect(homeForRole('student')).toBe('/student');
    expect(homeForRole('teacher')).toBe('/teacher');
    expect(homeForRole('parent')).toBe('/parent');
    expect(homeForRole('school_admin')).toBe('/school-admin');
    expect(homeForRole('admin')).toBe('/admin');
    expect(homeForRole(null)).toBe('/khong-co-quyen');
  });
});

describe('Ai được gán vai trò (hàm server)', () => {
  const A = 'school-a';
  const B = 'school-b';
  const sa = { id: 'sa', role: 'school_admin' as const, schoolId: A };
  const admin = { id: 'ad', role: 'admin' as const, schoolId: null };

  test('không ai tự đổi vai trò của mình, kể cả admin', () => {
    expect(canAssignRole(admin, { id: 'ad', role: 'admin', schoolId: null }, 'teacher')).toBe(false);
    expect(canAssignRole(sa, { id: 'sa', role: 'school_admin', schoolId: A }, 'admin')).toBe(false);
  });

  test.each(['teacher', 'student', 'parent', null] as const)('học sinh/giáo viên/phụ huynh không gán được vai trò (%s)', (role) => {
    const actor = { id: 'x', role, schoolId: A };
    expect(canAssignRole(actor, { id: 'y', role: null, schoolId: A }, 'teacher')).toBe(false);
  });

  test('quản trị trường chỉ gán teacher/student/parent trong trường mình', () => {
    expect(canAssignRole(sa, { id: 'u', role: null, schoolId: null }, 'teacher')).toBe(true);
    expect(canAssignRole(sa, { id: 'u', role: 'student', schoolId: A }, 'parent')).toBe(true);
    expect(canAssignRole(sa, { id: 'u', role: null, schoolId: B }, 'teacher')).toBe(false);
    expect(canAssignRole(sa, { id: 'u', role: null, schoolId: A }, 'school_admin')).toBe(false);
    expect(canAssignRole(sa, { id: 'u', role: null, schoolId: A }, 'admin')).toBe(false);
    expect(canAssignRole(sa, { id: 'u', role: 'school_admin', schoolId: A }, 'teacher')).toBe(false);
  });

  test('đặt lại mật khẩu: giáo viên phải dạy học sinh đó', () => {
    const t = { id: 't', role: 'teacher' as const, schoolId: A };
    const st = { id: 's', role: 'student' as const, schoolId: A };
    expect(canResetStudentPassword(t, st, { teachesStudent: true })).toBe(true);
    expect(canResetStudentPassword(t, st, { teachesStudent: false })).toBe(false);
    expect(canResetStudentPassword(sa, st, { teachesStudent: false })).toBe(true);
    expect(canResetStudentPassword(sa, { ...st, schoolId: B }, { teachesStudent: false })).toBe(false);
    expect(canResetStudentPassword({ id: 'p', role: 'parent', schoolId: A }, st, { teachesStudent: false })).toBe(false);
    expect(canResetStudentPassword(t, { id: 't2', role: 'teacher', schoolId: A }, { teachesStudent: true })).toBe(false);
  });
});

describe('Mật khẩu', () => {
  test('quy tắc mật khẩu mới', () => {
    const s = newPasswordSchema('EDU6A101');
    expect(s.safeParse('abc12345').success).toBe(true);
    expect(s.safeParse('short1').success).toBe(false);
    expect(s.safeParse('chiconchu').success).toBe(false);
    expect(s.safeParse('12345678').success).toBe(false);
    expect(s.safeParse('xEDU6A101x').success).toBe(false);
  });

  test('phải nhập lại giống nhau và khác mật khẩu cũ', () => {
    const s = changePasswordSchema(null);
    expect(s.safeParse({ currentPassword: 'old12345', newPassword: 'new12345', confirmPassword: 'new12345' }).success).toBe(true);
    expect(s.safeParse({ currentPassword: 'old12345', newPassword: 'new12345', confirmPassword: 'new12346' }).success).toBe(false);
    expect(s.safeParse({ currentPassword: 'same1234', newPassword: 'same1234', confirmPassword: 'same1234' }).success).toBe(false);
  });

  test('mật khẩu tạm: 10 ký tự, có chữ và số, không có O/0/I/1/l', () => {
    for (let i = 0; i < 200; i++) {
      const p = generateTempPassword();
      expect(p).toHaveLength(10);
      expect(p).toMatch(/[0-9]/);
      expect(p).toMatch(/[A-Za-z]/);
      expect(p).not.toMatch(/[O0I1l]/);
    }
  });
});

// Bộ đếm sai trong bộ nhớ, mô phỏng đúng hàm SQL login_record_failure
function fakeDeps(validEmail: string, validPassword: string) {
  const store = new Map<string, { count: number; lockedUntil: Date | null }>();
  let now = new Date('2026-10-20T08:00:00Z');
  const signInCalls: string[] = [];
  const deps: LoginDeps = {
    now: () => now,
    async getLockedUntil(key) {
      const r = store.get(key);
      return r?.lockedUntil && r.lockedUntil > now ? r.lockedUntil : null;
    },
    async recordFailure(key, max) {
      const r = store.get(key) ?? { count: 0, lockedUntil: null };
      if (r.lockedUntil && r.lockedUntil <= now) Object.assign(r, { count: 0, lockedUntil: null });
      r.count += 1;
      if (r.count >= max) r.lockedUntil = new Date(now.getTime() + 15 * 60_000);
      store.set(key, r);
      return r.lockedUntil;
    },
    async clearFailures(key) {
      store.delete(key);
    },
    async signIn(email, password) {
      signInCalls.push(email);
      return email === validEmail && password === validPassword ? { ok: true, userId: 'u1' } : { ok: false };
    },
  };
  return { deps, store, signInCalls, advance: (min: number) => (now = new Date(now.getTime() + min * 60_000)) };
}

describe('Đăng nhập và giới hạn số lần sai', () => {
  const email = 'edu6a101@hs.eduverse.local';

  test('đăng nhập bằng mã học sinh gọi Supabase với email nội bộ', async () => {
    const f = fakeDeps(email, 'Tam12345');
    const r = await authenticate({ identifier: 'edu6a101', password: 'Tam12345', ip: '1.2.3.4' }, f.deps);
    expect(r).toEqual({ ok: true, userId: 'u1' });
    expect(f.signInCalls).toEqual([email]);
  });

  test('sai 5 lần → khóa 15 phút, kể cả khi sau đó nhập đúng; hết hạn thì đăng nhập lại được', async () => {
    const f = fakeDeps(email, 'Tam12345');
    for (let i = 1; i <= 4; i++) {
      const r = await authenticate({ identifier: 'EDU6A101', password: 'sai', ip: null }, f.deps);
      expect(r).toEqual({ ok: false, reason: 'invalid' });
    }
    const fifth = await authenticate({ identifier: 'EDU6A101', password: 'sai', ip: null }, f.deps);
    expect(fifth).toEqual({ ok: false, reason: 'locked', retryAfterMinutes: 15 });

    f.signInCalls.length = 0;
    const whileLocked = await authenticate({ identifier: 'EDU6A101', password: 'Tam12345', ip: null }, f.deps);
    expect(whileLocked.ok).toBe(false);
    expect(f.signInCalls).toEqual([]); // không thử mật khẩu khi đang khóa

    f.advance(16);
    const after = await authenticate({ identifier: 'EDU6A101', password: 'Tam12345', ip: null }, f.deps);
    expect(after.ok).toBe(true);
  });

  test('khóa cả định danh không tồn tại (không lộ tài khoản nào có thật)', async () => {
    const f = fakeDeps(email, 'Tam12345');
    let last;
    for (let i = 0; i < 5; i++) last = await authenticate({ identifier: 'KHONGCO99', password: 'x', ip: null }, f.deps);
    expect(last).toMatchObject({ reason: 'locked' });
  });

  test('học sinh khác cùng IP trường không bị khóa theo bạn (ngưỡng IP cao)', async () => {
    const f = fakeDeps('edu6a102@hs.eduverse.local', 'Tam12345');
    for (let i = 0; i < 5; i++) await authenticate({ identifier: 'EDU6A101', password: 'x', ip: '10.0.0.1' }, f.deps);
    const other = await authenticate({ identifier: 'EDU6A102', password: 'Tam12345', ip: '10.0.0.1' }, f.deps);
    expect(other.ok).toBe(true);
  });

  test('đăng nhập đúng xóa bộ đếm sai', async () => {
    const f = fakeDeps(email, 'Tam12345');
    await authenticate({ identifier: 'EDU6A101', password: 'x', ip: null }, f.deps);
    await authenticate({ identifier: 'EDU6A101', password: 'Tam12345', ip: null }, f.deps);
    expect(f.store.has(hashKey('id', email))).toBe(false);
  });

  test('khóa đếm chỉ chứa mã băm, không chứa định danh gốc', () => {
    expect(hashKey('id', email)).toMatch(/^id:[0-9a-f]{64}$/);
    expect(hashKey('id', email)).not.toContain('edu6a101');
  });
});
