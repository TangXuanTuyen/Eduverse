// Luật Đấu trường ánh sáng (đấu 2 bạn): logic thuần, máy chủ dùng để điều khiển trận.

export const ROUND_SECONDS = 20;
export const REVEAL_MS = 4000; // thời gian xem đáp án giữa hai câu
export const START_DELAY_MS = 4000; // đếm ngược trước câu đầu
export const INVITE_TTL_MS = 3 * 60 * 1000;
export const MAX_ROUNDS = 10;
export const MIN_ROUNDS = 3;

export type Role = 'host' | 'guest';

/** Lực kéo theo chuỗi đúng (chuỗi đã tính câu vừa đúng), giống bản chơi với máy. */
export function pullPower(streakAfter: number): number {
  const base = 18;
  if (streakAfter >= 5) return base * 2.5;
  if (streakAfter >= 3) return base * 1.8;
  if (streakAfter >= 2) return base * 1.3;
  return base;
}

/** Chủ trận kéo về phía âm, khách kéo về phía dương. */
export function applyPull(crystal: number, winner: Role, power: number): number {
  const next = winner === 'host' ? crystal - power : crystal + power;
  return Math.max(-100, Math.min(100, Math.round(next)));
}

export function levelFromStreak(streak: number): 1 | 2 | 3 | 4 {
  if (streak >= 5) return 4;
  if (streak >= 3) return 3;
  if (streak >= 2) return 2;
  return 1;
}

export function decideWinner(crystal: number, hostScore: number, guestScore: number): 'host' | 'guest' | 'tie' {
  if (crystal < 0) return 'host';
  if (crystal > 0) return 'guest';
  if (hostScore !== guestScore) return hostScore > guestScore ? 'host' : 'guest';
  return 'tie';
}

export function roundCount(eligibleQuestions: number): number {
  return Math.min(MAX_ROUNDS, eligibleQuestions);
}

export function isInviteExpired(createdAtMs: number, nowMs: number): boolean {
  return nowMs - createdAtMs > INVITE_TTL_MS;
}
