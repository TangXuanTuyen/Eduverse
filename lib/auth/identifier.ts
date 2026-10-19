import { z } from 'zod';

/** Tên miền nội bộ cho email giả của học sinh (học sinh không có email thật). */
export const STUDENT_EMAIL_DOMAIN = 'hs.eduverse.local';

export const STUDENT_CODE_PATTERN = /^[A-Z0-9]{4,20}$/;

export type LoginIdentifier =
  | { kind: 'student'; studentCode: string; email: string }
  | { kind: 'email'; email: string };

const emailSchema = z.email();

/** Chuẩn hóa mã học sinh: bỏ khoảng trắng, viết hoa. */
export function normalizeStudentCode(input: string): string {
  return input.replace(/\s+/g, '').toUpperCase();
}

export function studentEmailFromCode(code: string): string {
  return `${normalizeStudentCode(code).toLowerCase()}@${STUDENT_EMAIL_DOMAIN}`;
}

/**
 * Ô "Mã học sinh hoặc email": có '@' → email; ngược lại → mã học sinh.
 * Trả về null nếu không hợp lệ (thông báo lỗi chung, không tiết lộ lý do cụ thể).
 */
export function parseLoginIdentifier(raw: string): LoginIdentifier | null {
  const input = raw.trim();
  if (!input || input.length > 254) return null;

  if (input.includes('@')) {
    const email = input.toLowerCase();
    if (!emailSchema.safeParse(email).success) return null;
    // Gõ thẳng email nội bộ cũng coi là đăng nhập học sinh
    if (email.endsWith(`@${STUDENT_EMAIL_DOMAIN}`)) {
      const code = normalizeStudentCode(email.slice(0, -(STUDENT_EMAIL_DOMAIN.length + 1)));
      return STUDENT_CODE_PATTERN.test(code) ? { kind: 'student', studentCode: code, email } : null;
    }
    return { kind: 'email', email };
  }

  const code = normalizeStudentCode(input);
  if (!STUDENT_CODE_PATTERN.test(code)) return null;
  return { kind: 'student', studentCode: code, email: studentEmailFromCode(code) };
}
