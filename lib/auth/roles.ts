export const APP_ROLES = ['admin', 'teacher', 'student', 'parent'] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_HOME: Record<AppRole, string> = {
  admin: '/admin',
  teacher: '/teacher',
  student: '/student',
  parent: '/parent',
};

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: 'Quản trị viên',
  teacher: 'Giáo viên',
  student: 'Học sinh',
  parent: 'Phụ huynh',
};

export const ONBOARDING_PATH = '/onboarding';

export function homeForRole(role: AppRole | null | undefined): string {
  return role ? ROLE_HOME[role] : ONBOARDING_PATH;
}

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === 'string' && (APP_ROLES as readonly string[]).includes(value);
}
