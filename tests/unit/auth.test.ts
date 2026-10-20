import { describe, expect, test } from 'vitest';
import { homeForRole, isAppRole } from '@/lib/auth/roles';

describe('Trang chủ theo vai trò', () => {
  test('mỗi vai trò về đúng khu vực; chưa có vai trò → trang onboarding', () => {
    expect(homeForRole('student')).toBe('/student');
    expect(homeForRole('teacher')).toBe('/teacher');
    expect(homeForRole('parent')).toBe('/parent');
    expect(homeForRole(null)).toBe('/onboarding');
    expect(homeForRole(undefined)).toBe('/onboarding');
  });
});

describe('isAppRole', () => {
  test('chấp nhận 3 vai trò hợp lệ', () => {
    expect(isAppRole('teacher')).toBe(true);
    expect(isAppRole('student')).toBe(true);
    expect(isAppRole('parent')).toBe(true);
  });

  test('từ chối vai trò cũ và giá trị sai', () => {
    expect(isAppRole('admin')).toBe(false);
    expect(isAppRole('school_admin')).toBe(false);
    expect(isAppRole('')).toBe(false);
    expect(isAppRole(null)).toBe(false);
    expect(isAppRole(42)).toBe(false);
  });
});
