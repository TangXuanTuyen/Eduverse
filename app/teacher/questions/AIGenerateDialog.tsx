'use client';

import { useActionState, useState } from 'react';
import { generateQuestionsAction, saveAIQuestionsAction, type AIGenerateState } from './ai-actions';
import type { CreateQuestionData } from '@/services/questions';

const SUBJECTS = [
  { id: 'vat-ly', name: 'Vật lý' },
  { id: 'hoa-hoc', name: 'Hóa học' },
  { id: 'sinh-hoc', name: 'Sinh học' },
  { id: 'khtn', name: 'KHTN tổng hợp' },
];

const TYPE_LABELS: Record<string, string> = {
  single_choice: 'Trắc nghiệm (1 đáp án)',
  multiple_choice: 'Trắc nghiệm (nhiều đáp án)',
  short_answer: 'Trả lời ngắn',
  essay: 'Tự luận',
};

type Props = { onClose: () => void };

export function AIGenerateDialog({ onClose }: Props) {
  const [state, formAction, pending] = useActionState<AIGenerateState, FormData>(generateQuestionsAction, {});
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ saved?: number; error?: string } | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const questions = state.questions ?? [];

  // Select all by default when questions arrive
  if (questions.length > 0 && selected.size === 0 && !saveResult) {
    const all = new Set(questions.map((_, i) => i));
    setTimeout(() => setSelected(all), 0);
  }

  async function handleSave() {
    const toSave = questions.filter((_, i) => selected.has(i));
    if (toSave.length === 0) return;
    setSaving(true);
    const result = await saveAIQuestionsAction(JSON.stringify(toSave));
    setSaving(false);
    setSaveResult(result);
  }

  if (saveResult?.saved) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <p className="text-green-400 text-sm">Đã lưu {saveResult.saved} câu hỏi vào ngân hàng!</p>
        <button onClick={onClose} className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]">
          Đóng
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-4 space-y-4">
      <h3 className="font-bold text-white flex items-center gap-2">
        <span className="text-purple-400">✦</span> Tạo câu hỏi bằng AI
      </h3>
      <p className="text-xs text-slate-400">AI tạo câu hỏi mẫu — giáo viên xem lại và chọn trước khi lưu.</p>

      {/* Config form */}
      {questions.length === 0 && (
        <form action={formAction} className="space-y-3">
          {state.error && <p className="text-red-400 text-sm">{state.error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-slate-400">Môn học</span>
              <select name="subject" required className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white">
                {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">Lớp</span>
              <select name="grade" className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white">
                {[6, 7, 8, 9].map((g) => <option key={g} value={g}>Lớp {g}</option>)}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-xs text-slate-400">Chủ đề / Bài học</span>
            <input
              name="topic"
              type="text"
              required
              placeholder="VD: Lực và chuyển động, Phản ứng hóa học..."
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white"
            />
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="text-xs text-slate-400">Loại câu hỏi</span>
              <select name="type" className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white">
                {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">Độ khó</span>
              <select name="difficulty" className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white">
                <option value="1">Dễ</option>
                <option value="2">Trung bình</option>
                <option value="3">Khó</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">Số câu</span>
              <input name="count" type="number" min={1} max={20} defaultValue={5} className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white" />
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-purple-600 hover:bg-purple-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 min-h-[44px]"
            >
              {pending ? 'AI đang tạo...' : 'Tạo câu hỏi'}
            </button>
            <button type="button" onClick={onClose} className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]">
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Preview generated questions */}
      {questions.length > 0 && (
        <div className="space-y-3">
          {saveResult?.error && <p className="text-red-400 text-sm">{saveResult.error}</p>}

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">AI đã tạo {questions.length} câu — chọn câu muốn lưu:</p>
            <button
              type="button"
              onClick={() => setSelected(selected.size === questions.length ? new Set() : new Set(questions.map((_, i) => i)))}
              className="text-xs text-purple-400 hover:underline"
            >
              {selected.size === questions.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {questions.map((q, i) => (
              <AIQuestionPreview
                key={i}
                index={i}
                question={q}
                selected={selected.has(i)}
                onToggle={() => {
                  setSelected((prev) => {
                    const next = new Set(prev);
                    next.has(i) ? next.delete(i) : next.add(i);
                    return next;
                  });
                }}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || selected.size === 0}
              className="rounded-lg bg-green-600 hover:bg-green-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 min-h-[44px]"
            >
              {saving ? 'Đang lưu...' : `Lưu ${selected.size} câu hỏi`}
            </button>
            <button type="button" onClick={onClose} className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]">
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AIQuestionPreview({
  index,
  question: q,
  selected,
  onToggle,
}: {
  index: number;
  question: CreateQuestionData;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <label className={`flex items-start gap-2 p-3 rounded-lg cursor-pointer transition ${selected ? 'bg-purple-900/20 border border-purple-500/30' : 'bg-slate-800 border border-slate-700'}`}>
      <input type="checkbox" checked={selected} onChange={onToggle} className="mt-1" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">{index + 1}. {q.content}</p>
        {q.options && (
          <div className="mt-1 space-y-0.5">
            {q.options.map((o) => (
              <p key={o.id} className="text-xs text-slate-400">
                <span className="font-mono">{o.id.toUpperCase()}.</span> {o.text}
              </p>
            ))}
          </div>
        )}
        {q.explanation && (
          <p className="text-xs text-slate-500 mt-1 italic">Giải thích: {q.explanation}</p>
        )}
        {q.skill_tags && q.skill_tags.length > 0 && (
          <div className="flex gap-1 mt-1">
            {q.skill_tags.map((t) => (
              <span key={t} className="text-[10px] bg-slate-700 text-slate-400 px-1 rounded">{t}</span>
            ))}
          </div>
        )}
      </div>
    </label>
  );
}
