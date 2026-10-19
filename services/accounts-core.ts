import { randomInt } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeStudentCode, STUDENT_CODE_PATTERN, studentEmailFromCode } from '@/lib/auth/identifier';
import type { AppRole } from '@/lib/auth/roles';

/**
 * Tạo tài khoản bằng client service_role. Không import 'server-only' để script seed dùng được,
 * nhưng chỉ được gọi từ code server sau khi đã kiểm tra quyền (canAssignRole...).
 */

// Bỏ ký tự dễ nhầm O/0/I/1/l
const READABLE = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
const DIGITS = '23456789';

/** Mật khẩu tạm dễ đọc cho học sinh (10 ký tự, luôn có chữ và số). */
export function generateTempPassword(length = 10): string {
  const chars = Array.from({ length: length - 2 }, () => READABLE[randomInt(READABLE.length)]);
  chars.push(DIGITS[randomInt(DIGITS.length)], 'abcdefghjkmnpqrstuvwxyz'[randomInt(23)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

type ProfilePatch = {
  role: AppRole;
  school_id: string | null;
  display_name: string;
  student_code?: string | null;
  grade?: number | null;
  must_change_password?: boolean;
};

async function setProfile(admin: SupabaseClient, userId: string, patch: ProfilePatch) {
  const { error } = await admin.from('profiles').update(patch).eq('id', userId);
  if (error) throw new Error(`Cập nhật hồ sơ ${userId} lỗi: ${error.message}`);
}

async function createAuthUser(admin: SupabaseClient, email: string, password: string): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    // Không đặt user_metadata/app_metadata: vai trò chỉ nằm ở bảng profiles
  });
  if (error || !data.user) throw new Error(`Tạo tài khoản ${email} lỗi: ${error?.message}`);
  return data.user.id;
}

export async function createStudentAccount(
  admin: SupabaseClient,
  input: { schoolId: string; studentCode: string; displayName: string; grade: number; tempPassword: string }
): Promise<{ userId: string; email: string }> {
  const code = normalizeStudentCode(input.studentCode);
  if (!STUDENT_CODE_PATTERN.test(code)) throw new Error(`Mã học sinh không hợp lệ: ${input.studentCode}`);
  const email = studentEmailFromCode(code);
  const userId = await createAuthUser(admin, email, input.tempPassword);
  await setProfile(admin, userId, {
    role: 'student',
    school_id: input.schoolId,
    display_name: input.displayName,
    student_code: code,
    grade: input.grade,
    must_change_password: true,
  });
  return { userId, email };
}

export async function createStaffOrParentAccount(
  admin: SupabaseClient,
  input: {
    email: string;
    role: Exclude<AppRole, 'student'>;
    schoolId: string | null;
    displayName: string;
    password: string;
    mustChangePassword?: boolean;
  }
): Promise<{ userId: string }> {
  const userId = await createAuthUser(admin, input.email.toLowerCase(), input.password);
  await setProfile(admin, userId, {
    role: input.role,
    school_id: input.schoolId,
    display_name: input.displayName,
    must_change_password: input.mustChangePassword ?? false,
  });
  return { userId };
}

/** Đặt lại mật khẩu học sinh về mật khẩu tạm và bắt đổi ở lần đăng nhập tới. */
export async function resetStudentPassword(admin: SupabaseClient, studentId: string, tempPassword: string) {
  const { error } = await admin.auth.admin.updateUserById(studentId, { password: tempPassword });
  if (error) throw new Error(`Đặt lại mật khẩu lỗi: ${error.message}`);
  const { error: flagError } = await admin
    .from('profiles')
    .update({ must_change_password: true })
    .eq('id', studentId)
    .eq('role', 'student');
  if (flagError) throw new Error(`Cập nhật cờ đổi mật khẩu lỗi: ${flagError.message}`);
}
