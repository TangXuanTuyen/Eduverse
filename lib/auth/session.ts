import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { homeForRole, isAppRole, type AppRole } from '@/lib/auth/roles';

export type CurrentProfile = {
  id: string;
  role: AppRole | null;
  schoolId: string | null;
  displayName: string;
  studentCode: string | null;
  grade: number | null;
  mustChangePassword: boolean;
};

/**
 * Người dùng hiện tại + hồ sơ, đọc qua RLS (chỉ đọc được hàng của chính mình).
 * Vai trò lấy từ bảng profiles, không bao giờ từ metadata trong JWT.
 * Dùng cache() để nhiều layout/page trong cùng request chỉ truy vấn một lần.
 */
export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, school_id, display_name, student_code, grade, must_change_password')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;

  return {
    id: data.id,
    role: isAppRole(data.role) ? data.role : null,
    schoolId: data.school_id,
    displayName: data.display_name,
    studentCode: data.student_code,
    grade: data.grade,
    mustChangePassword: data.must_change_password,
  };
});

/**
 * Chặn route ở server: chưa đăng nhập → /login; phải đổi mật khẩu → /doi-mat-khau;
 * sai vai trò → về trang chủ đúng vai trò của mình.
 */
export async function requireRole(...allowed: AppRole[]): Promise<CurrentProfile & { role: AppRole }> {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (profile.mustChangePassword) redirect('/doi-mat-khau');
  if (!profile.role || !allowed.includes(profile.role)) redirect(homeForRole(profile.role));
  return profile as CurrentProfile & { role: AppRole };
}
