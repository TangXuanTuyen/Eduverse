'use client';

import { useState, useEffect } from 'react';
import { createSetAction } from './set-actions';

type Question = { id: string; type: string; content: string; difficulty: number };

const DIFF_LABELS: Record<number, string> = { 1: 'Dễ', 2: 'TB', 3: 'Khó' };
const TYPE_SHORT: Record<string, string> = {
  single_choice: 'TN1',
  multiple_choice: 'TNN',
  short_answer: 'Ngắn',
  essay: 'TL',
};

type Props = { onClose: () => void };

export function CreateSetDialog({ onClose }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/teacher/questions')
      .then((r) => r.json())
      .then((d) => setQuestions(d.questions ?? []))
      .catch(() => {});
  }, []);

  async function handleSave() {
    if (selected.size === 0 || !name.trim()) return;
    setSaving(true);
    const res = await createSetAction(name.trim(), Array.from(selected));
    setSaving(false);
    setResult(res);
  }

  if (result?.success) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <p className="text-green-400 text-sm">Đã tạo bộ đề &quot;{name}&quot; với {selected.size} câu hỏi!</p>
        <p className="text-xs text-slate-400">Vào Bài giao → chọn bộ đề này để giao cho học sinh.</p>
        <button onClick={onClose} className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]">
          Đóng
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-4 space-y-4">
      <h3 className="font-bold text-white">Tạo bộ đề từ câu hỏi có sẵn</h3>
      <p className="text-xs text-slate-400">Chọn các câu hỏi muốn gom thành bộ đề để giao bài.</p>

      {result?.error && <p className="text-red-400 text-sm">{result.error}</p>}

      <label className="block">
        <span className="text-xs text-slate-400">Tên bộ đề</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="VD: Kiểm tra chương 1 - Vật lý 8"
          className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white"
        />
      </label>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400">Chọn câu hỏi ({selected.size}/{questions.length})</span>
          <button
            type="button"
            onClick={() => setSelected(selected.size === questions.length ? new Set() : new Set(questions.map((q) => q.id)))}
            className="text-xs text-cyan-400 hover:underline"
          >
            {selected.size === questions.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
          </button>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 max-h-64 overflow-y-auto p-2 space-y-1">
          {questions.length === 0 && <p className="text-xs text-slate-500 p-2">Chưa có câu hỏi nào.</p>}
          {questions.map((q) => (
            <label key={q.id} className={`flex items-start gap-2 p-2 rounded cursor-pointer transition ${selected.has(q.id) ? 'bg-cyan-900/20' : 'hover:bg-slate-700'}`}>
              <input
                type="checkbox"
                checked={selected.has(q.id)}
                onChange={(e) => {
                  setSelected((prev) => {
                    const next = new Set(prev);
                    e.target.checked ? next.add(q.id) : next.delete(q.id);
                    return next;
                  });
                }}
                className="mt-0.5 accent-cyan-500"
              />
              <div className="flex-1 min-w-0">
                <div className="flex gap-1 mb-0.5">
                  <span className="text-[10px] bg-slate-700 text-slate-400 px-1 rounded">{TYPE_SHORT[q.type] ?? q.type}</span>
                  <span className="text-[10px] bg-slate-700 text-slate-400 px-1 rounded">{DIFF_LABELS[q.difficulty] ?? q.difficulty}</span>
                </div>
                <p className="text-sm text-white line-clamp-1">{q.content}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || selected.size === 0 || !name.trim()}
          className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 min-h-[44px]"
        >
          {saving ? 'Đang tạo...' : `Tạo bộ đề (${selected.size} câu)`}
        </button>
        <button type="button" onClick={onClose} className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]">
          Hủy
        </button>
      </div>
    </div>
  );
}
