import { describe, it, expect } from 'vitest';
import {
  buildPedagogyDirective,
  classifyIntent,
  supportLevelFromHistory,
} from '@/lib/ai/pedagogy';

describe('classifyIntent', () => {
  it('detects requests for the full answer', () => {
    expect(classifyIntent('cho em đáp án bài này')).toBe('answer_request');
    expect(classifyIntent('làm hộ mình bài 3')).toBe('answer_request');
  });

  it('detects requests to check an answer', () => {
    expect(classifyIntent('em chọn B, có đúng không?')).toBe('check_answer');
  });

  it('detects students who do not know yet', () => {
    expect(classifyIntent('mình chưa hiểu phần này')).toBe('unknown');
  });

  it('detects experiment and exercise questions', () => {
    expect(classifyIntent('quan sát hiện tượng khi đốt nến')).toBe('experiment');
    expect(classifyIntent('bài tập: tính điện trở tương đương 2 + 3')).toBe('exercise');
  });

  it('treats a short reply to a previous question as an attempt', () => {
    expect(classifyIntent('vì dòng điện chia đều', true)).toBe('attempt');
  });

  it('falls back to a knowledge question', () => {
    expect(classifyIntent('lực ma sát có tác dụng gì')).toBe('concept');
  });
});

describe('supportLevelFromHistory', () => {
  it('starts at level 0 with no prior replies', () => {
    expect(supportLevelFromHistory([{ role: 'user', content: 'lực là gì' }])).toBe(0);
  });

  it('increases as the assistant keeps replying', () => {
    const turns = (n: number) =>
      Array.from({ length: n }, () => [
        { role: 'user', content: 'thử xem' },
        { role: 'assistant', content: 'Bạn nghĩ sao?' },
      ]).flat();
    expect(supportLevelFromHistory(turns(1))).toBe(1);
    expect(supportLevelFromHistory(turns(2))).toBe(2);
    expect(supportLevelFromHistory(turns(4))).toBe(3);
  });

  it('raises support when the student repeatedly says they do not know', () => {
    const history = [
      { role: 'user', content: 'mình không biết' },
      { role: 'assistant', content: 'Thử nhớ lại định luật Ôm nhé?' },
      { role: 'user', content: 'vẫn chưa hiểu' },
      { role: 'assistant', content: 'Bạn thử áp dụng vào ví dụ này?' },
    ];
    expect(supportLevelFromHistory(history)).toBe(3);
  });
});

describe('buildPedagogyDirective', () => {
  it('forbids giving the full answer on the first request and limits to one question', () => {
    const d = buildPedagogyDirective('answer_request', 0);
    expect(d).toContain('Không đưa đáp án hoàn chỉnh');
    expect(d).toContain('Mỗi lượt chỉ đặt một câu hỏi');
  });

  it('includes the support level guide', () => {
    expect(buildPedagogyDirective('concept', 3)).toContain('Mức 3');
  });
});
