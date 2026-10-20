import { describe, expect, test } from 'vitest';
import { compareAnswers } from '@/services/adaptive-questions';

describe('compareAnswers — single_choice', () => {
  test('đúng khi trùng khớp', () => {
    expect(compareAnswers('single_choice', 'a', 'a')).toBe(true);
  });
  test('sai khi khác', () => {
    expect(compareAnswers('single_choice', 'a', 'b')).toBe(false);
  });
});

describe('compareAnswers — multiple_choice', () => {
  test('đúng khi cùng phần tử (khác thứ tự)', () => {
    expect(compareAnswers('multiple_choice', ['b', 'a'], ['a', 'b'])).toBe(true);
  });
  test('sai khi thiếu phần tử', () => {
    expect(compareAnswers('multiple_choice', ['a'], ['a', 'b'])).toBe(false);
  });
  test('sai khi không phải mảng', () => {
    expect(compareAnswers('multiple_choice', 'a', ['a'])).toBe(false);
  });
});

describe('compareAnswers — short_answer', () => {
  test('đúng khi khớp 1 trong nhiều đáp án (case-insensitive)', () => {
    expect(compareAnswers('short_answer', 'Fe', ['fe', 'sắt'])).toBe(true);
    expect(compareAnswers('short_answer', ' Sắt ', ['fe', 'sắt'])).toBe(true);
  });
  test('sai khi không khớp', () => {
    expect(compareAnswers('short_answer', 'Cu', ['fe', 'sắt'])).toBe(false);
  });
});

describe('compareAnswers — ordering', () => {
  test('đúng khi đúng thứ tự', () => {
    expect(compareAnswers('ordering', ['A', 'B', 'C'], ['A', 'B', 'C'])).toBe(true);
  });
  test('sai khi sai thứ tự', () => {
    expect(compareAnswers('ordering', ['B', 'A', 'C'], ['A', 'B', 'C'])).toBe(false);
  });
});

describe('compareAnswers — matching', () => {
  test('đúng khi tất cả cặp khớp', () => {
    expect(compareAnswers('matching', { A: '1', B: '2' }, { A: '1', B: '2' })).toBe(true);
  });
  test('sai khi nối sai', () => {
    expect(compareAnswers('matching', { A: '2', B: '1' }, { A: '1', B: '2' })).toBe(false);
  });
  test('sai khi thiếu cặp', () => {
    expect(compareAnswers('matching', { A: '1' }, { A: '1', B: '2' })).toBe(false);
  });
});

describe('compareAnswers — classification', () => {
  test('đúng khi phân loại đúng (bất kể thứ tự trong nhóm)', () => {
    expect(compareAnswers('classification',
      { 'Động vật': ['Chó', 'Mèo'], 'Thực vật': ['Cây'] },
      { 'Động vật': ['Mèo', 'Chó'], 'Thực vật': ['Cây'] },
    )).toBe(true);
  });
  test('sai khi phân loại sai', () => {
    expect(compareAnswers('classification',
      { 'Động vật': ['Chó', 'Cây'], 'Thực vật': ['Mèo'] },
      { 'Động vật': ['Mèo', 'Chó'], 'Thực vật': ['Cây'] },
    )).toBe(false);
  });
});
