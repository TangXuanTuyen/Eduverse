import { z } from 'zod';

/** Quy tắc mật khẩu mới: đủ dài, có chữ và số, không chứa mã học sinh. */
export function newPasswordSchema(studentCode?: string | null) {
  return z
    .string()
    .min(8, 'Mật khẩu cần ít nhất 8 ký tự')
    .max(72, 'Mật khẩu tối đa 72 ký tự')
    .refine((v) => /[A-Za-zÀ-ỹ]/.test(v) && /[0-9]/.test(v), 'Mật khẩu cần có cả chữ và số')
    .refine(
      (v) => !studentCode || !v.toUpperCase().includes(studentCode.toUpperCase()),
      'Mật khẩu không được chứa mã học sinh'
    );
}

export const changePasswordSchema = (studentCode?: string | null) =>
  z
    .object({
      currentPassword: z.string().min(1, 'Nhập mật khẩu hiện tại'),
      newPassword: newPasswordSchema(studentCode),
      confirmPassword: z.string(),
    })
    .refine((v) => v.newPassword === v.confirmPassword, {
      message: 'Hai mật khẩu mới chưa giống nhau',
      path: ['confirmPassword'],
    })
    .refine((v) => v.newPassword !== v.currentPassword, {
      message: 'Mật khẩu mới phải khác mật khẩu cũ',
      path: ['newPassword'],
    });
