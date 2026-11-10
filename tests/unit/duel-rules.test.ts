import { describe, it, expect } from 'vitest';
import { applyPull, decideWinner, levelFromStreak, pullPower, roundCount, isInviteExpired, INVITE_TTL_MS } from '@/lib/duel/rules';

describe('luật đấu 2 bạn', () => {
  it('lực kéo tăng theo chuỗi đúng', () => {
    expect(pullPower(1)).toBe(18);
    expect(pullPower(2)).toBeCloseTo(23.4);
    expect(pullPower(3)).toBeCloseTo(32.4);
    expect(pullPower(5)).toBe(45);
  });
  it('chủ trận kéo về âm, khách về dương, có chặn ±100', () => {
    expect(applyPull(0, 'host', 18)).toBe(-18);
    expect(applyPull(0, 'guest', 18)).toBe(18);
    expect(applyPull(-90, 'host', 45)).toBe(-100);
    expect(applyPull(95, 'guest', 45)).toBe(100);
  });
  it('cấp tiến hóa theo chuỗi', () => {
    expect([0, 1, 2, 3, 4, 5, 9].map(levelFromStreak)).toEqual([1, 1, 2, 3, 3, 4, 4]);
  });
  it('chọn người thắng theo pha lê, rồi điểm, rồi hòa', () => {
    expect(decideWinner(-20, 1, 5)).toBe('host');
    expect(decideWinner(20, 5, 1)).toBe('guest');
    expect(decideWinner(0, 3, 2)).toBe('host');
    expect(decideWinner(0, 2, 3)).toBe('guest');
    expect(decideWinner(0, 2, 2)).toBe('tie');
  });
  it('số hiệp tối đa 10; lời mời hết hạn sau 3 phút', () => {
    expect(roundCount(25)).toBe(10);
    expect(roundCount(5)).toBe(5);
    expect(isInviteExpired(0, INVITE_TTL_MS)).toBe(false);
    expect(isInviteExpired(0, INVITE_TTL_MS + 1)).toBe(true);
  });
});
