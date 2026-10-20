import { describe, expect, test } from 'vitest';
import { calculateLevel } from '@/services/xp';

describe('calculateLevel', () => {
  test('0 XP = level 1', () => {
    const r = calculateLevel(0);
    expect(r.level).toBe(1);
    expect(r.progress).toBe(0);
  });

  test('99 XP = still level 1, progress 99%', () => {
    const r = calculateLevel(99);
    expect(r.level).toBe(1);
    expect(r.xpForNext).toBe(100);
    expect(r.progress).toBeCloseTo(0.99);
  });

  test('100 XP = level 2 (level 1 needs 100 XP)', () => {
    const r = calculateLevel(100);
    expect(r.level).toBe(2);
    expect(r.progress).toBe(0);
  });

  test('300 XP = level 3 (100+200=300)', () => {
    const r = calculateLevel(300);
    expect(r.level).toBe(3);
    expect(r.progress).toBe(0);
  });

  test('350 XP = level 3, progress 50/300', () => {
    const r = calculateLevel(350);
    expect(r.level).toBe(3);
    expect(r.xpForNext).toBe(300);
    expect(r.progress).toBeCloseTo(50 / 300);
  });

  test('large XP', () => {
    const r = calculateLevel(10000);
    expect(r.level).toBeGreaterThan(1);
  });
});
