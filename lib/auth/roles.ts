export const APP_ROLES = ['admin', 'school_admin', 'teacher', 'student', 'parent'] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_HOME: Record<AppRole, string> = {
  admin: '/admin',
  school_admin: '/school-admin',
  teacher: '/teacher',
  student: '/student',
  parent: '/parent',
};

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: 'Quản trị hệ thống',
  school_admin: 'Quản trị nhà trường',
  teacher: 'Giáo viên',
  student: 'Học sinh',
  parent: 'Phụ huynh',
};

/** Trang chưa được cấp quyền (tài khoản mới, chưa có vai trò). */
export const NO_ACCESS_PATH = '/khong-co-quyen';

export function homeForRole(role: AppRole | null | undefined): string {
  return role ? ROLE_HOME[role] : NO_ACCESS_PATH;
}

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === 'string' && (APP_ROLES as readonly string[]).includes(value);
}

type Actor = { id: string; role: AppRole | null; schoolId: string | null };
type Target = { id: string; role: AppRole | null; schoolId: string | null };

/**
 * Ai được gán vai trò nào cho ai. Dùng ở hàm server trước khi ghi bằng service_role.
 * - admin: gán mọi vai trò.
 * - school_admin: chỉ gán teacher/student/parent cho tài khoản thuộc trường mình
 *   (hoặc tài khoản chưa thuộc trường nào → sẽ được gắn vào trường mình), và không đụng tới
 *   tài khoản admin/school_admin.
 * - không ai tự đổi vai trò của chính mình.
 */
export function canAssignRole(actor: Actor, target: Target, newRole: AppRole): boolean {
  if (actor.id === target.id) return false;
  if (actor.role === 'admin') return true;
  if (actor.role !== 'school_admin' || !actor.schoolId) return false;
  if (!['teacher', 'student', 'parent'].includes(newRole)) return false;
  if (target.role === 'admin' || target.role === 'school_admin') return false;
  return target.schoolId === null || target.schoolId === actor.schoolId;
}

/** Giáo viên (dạy lớp của học sinh) hoặc quản trị trường được đặt lại mật khẩu học sinh. */
export function canResetStudentPassword(
  actor: Actor,
  student: Target,
  opts: { teachesStudent: boolean }
): boolean {
  if (student.role !== 'student' || actor.id === student.id) return false;
  if (actor.role === 'admin') return true;
  if (actor.role === 'school_admin') return actor.schoolId !== null && actor.schoolId === student.schoolId;
  if (actor.role === 'teacher') return opts.teachesStudent && actor.schoolId === student.schoolId;
  return false;
}
