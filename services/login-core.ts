import { createHash } from 'node:crypto';
import { parseLoginIdentifier } from '@/lib/auth/identifier';

/**
 * Lõi nghiệp vụ đăng nhập, tách khỏi Next.js/Supabase để kiểm thử được.
 * - Khóa theo định danh: 5 lần sai / 15 phút → khóa 15 phút.
 * - Khóa theo IP: ngưỡng cao hơn nhiều vì cả trường thường dùng chung một IP.
 * - Khóa áp dụng cả với định danh không tồn tại → không lộ tài khoản nào có thật.
 */
export const LOGIN_LIMITS = {
  identifier: { maxFailures: 5 },
  ip: { maxFailures: 50 },
  lockMinutes: 15,
} as const;

export type LoginDeps = {
  getLockedUntil(key: string): Promise<Date | null>;
  recordFailure(key: string, maxFailures: number): Promise<Date | null>;
  clearFailures(key: string): Promise<void>;
  signIn(email: string, password: string): Promise<{ ok: true; userId: string } | { ok: false }>;
  now?: () => Date;
};

export type LoginResult =
  | { ok: true; userId: string }
  | { ok: false; reason: 'invalid' }
  | { ok: false; reason: 'locked'; retryAfterMinutes: number };

export function hashKey(prefix: 'id' | 'ip', value: string): string {
  return `${prefix}:${createHash('sha256').update(value).digest('hex')}`;
}

export async function authenticate(
  input: { identifier: string; password: string; ip: string | null },
  deps: LoginDeps
): Promise<LoginResult> {
  const now = deps.now ?? (() => new Date());
  const parsed = parseLoginIdentifier(input.identifier);
  // Định danh sai định dạng: vẫn đếm theo chuỗi gốc để không thử vô hạn
  const idKey = hashKey('id', parsed ? parsed.email : input.identifier.trim().toLowerCase());
  const ipKey = input.ip ? hashKey('ip', input.ip) : null;

  const lockedUntil = latest(await deps.getLockedUntil(idKey), ipKey ? await deps.getLockedUntil(ipKey) : null);
  if (lockedUntil) return locked(lockedUntil, now());

  const password = input.password;
  const result = parsed && password.length > 0 && password.length <= 72
    ? await deps.signIn(parsed.email, password)
    : { ok: false as const };

  if (result.ok) {
    await deps.clearFailures(idKey);
    return { ok: true, userId: result.userId };
  }

  const idLock = await deps.recordFailure(idKey, LOGIN_LIMITS.identifier.maxFailures);
  const ipLock = ipKey ? await deps.recordFailure(ipKey, LOGIN_LIMITS.ip.maxFailures) : null;
  const newLock = latest(idLock, ipLock);
  return newLock ? locked(newLock, now()) : { ok: false, reason: 'invalid' };
}

function latest(a: Date | null, b: Date | null): Date | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

function locked(until: Date, now: Date): LoginResult {
  const minutes = Math.max(1, Math.ceil((until.getTime() - now.getTime()) / 60_000));
  return { ok: false, reason: 'locked', retryAfterMinutes: minutes };
}
