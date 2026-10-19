import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { canAssignRole, canResetStudentPassword, isAppRole, type AppRole } from '@/lib/auth/roles';
import { generateTempPassword, resetStudentPassword } from '@/services/accounts-core';

/**
 * Hàm server cho thao tác quản trị tài khoản. Luôn tự kiểm tra quyền của người gọi
 * (đọc từ CSDL) trước khi dùng service_role. Giao diện quản trị sẽ gọi các hàm này ở bước sau.
 */

async function loadTarget(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from('profiles').select('id, role, school_id').eq('id', userId).maybeSingle();
  if (error || !data) throw new Error('Không tìm thấy tài khoản');
  return { id: data.id as string, role: isAppRole(data.role) ? data.role : null, schoolId: data.school_id as string | null };
}

export async function assignRole(targetUserId: string, newRole: AppRole) {
  const actor = await getCurrentProfile();
  if (!actor) throw new Error('Chưa đăng nhập');
  const target = await loadTarget(targetUserId);
  if (!canAssignRole(actor, target, newRole)) throw new Error('Bạn không có quyền gán vai trò này');

  const admin = createAdminClient();
  const schoolId = actor.role === 'school_admin' ? actor.schoolId : target.schoolId;
  const { error } = await admin
    .from('profiles')
    .update({ role: newRole, school_id: newRole === 'admin' ? null : schoolId })
    .eq('id', targetUserId);
  if (error) throw new Error(`Gán vai trò lỗi: ${error.message}`);
}

/** Giáo viên dạy lớp của học sinh hoặc quản trị trường đặt lại mật khẩu; trả về mật khẩu tạm mới. */
export async function resetPasswordForStudent(studentId: string): Promise<string> {
  const actor = await getCurrentProfile();
  if (!actor) throw new Error('Chưa đăng nhập');
  const student = await loadTarget(studentId);

  let teaches = false;
  if (actor.role === 'teacher') {
    const supabase = await createClient();
    const { data } = await supabase.rpc('teaches_student', { p_student_id: studentId });
    teaches = data === true;
  }
  if (!canResetStudentPassword(actor, student, { teachesStudent: teaches })) {
    throw new Error('Bạn không có quyền đặt lại mật khẩu cho học sinh này');
  }

  const temp = generateTempPassword();
  await resetStudentPassword(createAdminClient(), studentId, temp);
  return temp;
}
