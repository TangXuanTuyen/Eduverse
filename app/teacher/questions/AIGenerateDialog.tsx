'use client';

import { useActionState, useState, useCallback } from 'react';
import { generateQuestionsAction, saveAIQuestionsAction, type AIGenerateState } from './ai-actions';
import type { CreateQuestionData } from '@/services/questions';

const SUBJECTS = [
  { id: 'vat-ly', name: 'Vật lý' },
  { id: 'hoa-hoc', name: 'Hóa học' },
  { id: 'sinh-hoc', name: 'Sinh học' },
  { id: 'khtn', name: 'KHTN tổng hợp' },
];

const QUESTION_TYPES = [
  { id: 'single_choice', name: 'Trắc nghiệm (1 đáp án)' },
  { id: 'multiple_choice', name: 'Trắc nghiệm (nhiều đáp án)' },
  { id: 'short_answer', name: 'Trả lời ngắn' },
  { id: 'essay', name: 'Tự luận' },
];

const DIFFICULTIES = [
  { id: 1, name: 'Dễ' },
  { id: 2, name: 'Trung bình' },
  { id: 3, name: 'Khó' },
];

const DIFF_LABELS: Record<number, string> = { 1: 'Dễ', 2: 'TB', 3: 'Khó' };
const TYPE_SHORT: Record<string, string> = {
  single_choice: 'TN1',
  multiple_choice: 'TNN',
  short_answer: 'Ngắn',
  essay: 'TL',
};

type Props = { onClose: () => void };

export function AIGenerateDialog({ onClose }: Props) {
  const [state, formAction, pending] = useActionState<AIGenerateState, FormData>(generateQuestionsAction, {});
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ saved?: number; error?: string } | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedQuestions, setEditedQuestions] = useState<CreateQuestionData[]>([]);

  const questions = editedQuestions.length > 0 ? editedQuestions : (state.questions ?? []);

  if (state.questions && state.questions.length > 0 && editedQuestions.length === 0) {
    setTimeout(() => {
      setEditedQuestions([...state.questions!]);
      setSelected(new Set(state.questions!.map((_, i) => i)));
    }, 0);
  }

  const updateQuestion = useCallback((index: number, updated: CreateQuestionData) => {
    setEditedQuestions((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
    setEditingIndex(null);
  }, []);

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
      <p className="text-xs text-slate-400">AI tạo câu hỏi mẫu — giáo viên xem lại, chỉnh sửa và chọn trước khi lưu.</p>

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

          <fieldset>
            <legend className="text-xs text-slate-400 mb-1">Loại câu hỏi (chọn nhiều)</legend>
            <div className="flex flex-wrap gap-2">
              {QUESTION_TYPES.map((t) => (
                <label key={t.id} className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white cursor-pointer hover:border-purple-500/50 has-[:checked]:border-purple-500 has-[:checked]:bg-purple-900/20">
                  <input type="checkbox" name="types" value={t.id} defaultChecked={t.id === 'single_choice'} className="accent-purple-500" />
                  {t.name}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs text-slate-400 mb-1">Độ khó (chọn nhiều)</legend>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((d) => (
                <label key={d.id} className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white cursor-pointer hover:border-purple-500/50 has-[:checked]:border-purple-500 has-[:checked]:bg-purple-900/20">
                  <input type="checkbox" name="difficulties" value={d.id} defaultChecked={d.id === 2} className="accent-purple-500" />
                  {d.name}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="text-xs text-slate-400">Số câu</span>
            <input name="count" type="number" min={1} max={20} defaultValue={5} className="mt-1 w-24 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white" />
          </label>

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

      {questions.length > 0 && (
        <div className="space-y-3">
          {saveResult?.error && <p className="text-red-400 text-sm">{saveResult.error}</p>}

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">AI đã tạo {questions.length} câu — chỉnh sửa, chọn rồi lưu:</p>
            <button
              type="button"
              onClick={() => setSelected(selected.size === questions.length ? new Set() : new Set(questions.map((_, i) => i)))}
              className="text-xs text-purple-400 hover:underline"
            >
              {selected.size === questions.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {questions.map((q, i) => (
              editingIndex === i ? (
                <QuestionEditor
                  key={i}
                  question={q}
                  onSave={(updated) => updateQuestion(i, updated)}
                  onCancel={() => setEditingIndex(null)}
                />
              ) : (
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
                  onEdit={() => setEditingIndex(i)}
                />
              )
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
            <button
              type="button"
              onClick={() => { setEditedQuestions([]); setSelected(new Set()); }}
              className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]"
            >
              Tạo lại
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
  onEdit,
}: {
  index: number;
  question: CreateQuestionData;
  selected: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg transition ${selected ? 'bg-purple-900/20 border border-purple-500/30' : 'bg-slate-800 border border-slate-700'}`}>
      <input type="checkbox" checked={selected} onChange={onToggle} className="mt-1 cursor-pointer" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] bg-purple-800/50 text-purple-300 px-1.5 rounded">{TYPE_SHORT[q.type] ?? q.type}</span>
          <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 rounded">{DIFF_LABELS[q.difficulty ?? 1] ?? q.difficulty}</span>
        </div>
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
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 text-xs text-blue-400 hover:text-blue-300 hover:underline mt-1 min-h-[44px] px-2"
      >
        Sửa
      </button>
    </div>
  );
}

function QuestionEditor({
  question,
  onSave,
  onCancel,
}: {
  question: CreateQuestionData;
  onSave: (q: CreateQuestionData) => void;
  onCancel: () => void;
}) {
  const [content, setContent] = useState(question.content);
  const [type, setType] = useState<string>(question.type);
  const [difficulty, setDifficulty] = useState(question.difficulty);
  const [explanation, setExplanation] = useState(question.explanation ?? '');
  const [options, setOptions] = useState(question.options ?? []);
  const [correctAnswer, setCorrectAnswer] = useState<unknown>(question.correct_answer);
  const [skillTags, setSkillTags] = useState((question.skill_tags ?? []).join(', '));

  const isChoice = type === 'single_choice' || type === 'multiple_choice';

  function handleSubmit() {
    const updated: CreateQuestionData = {
      type: type as CreateQuestionData['type'],
      content: content.trim(),
      options: isChoice ? options : null,
      correct_answer: correctAnswer,
      difficulty,
      explanation: explanation.trim() || undefined,
      skill_tags: skillTags.split(',').map((s) => s.trim()).filter(Boolean),
    };
    onSave(updated);
  }

  return (
    <div className="bg-slate-800 border border-blue-500/40 rounded-lg p-3 space-y-3">
      <div className="flex items-center gap-2 text-xs text-blue-400 font-medium">Chỉnh sửa câu hỏi</div>

      <label className="block">
        <span className="text-xs text-slate-400">Nội dung</span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-slate-400">Loại</span>
          <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white">
            {QUESTION_TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-slate-400">Độ khó</span>
          <select value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))} className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white">
            {DIFFICULTIES.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>
      </div>

      {isChoice && (
        <div className="space-y-2">
          <span className="text-xs text-slate-400">Lựa chọn</span>
          {options.map((opt, i) => (
            <div key={opt.id} className="flex gap-2 items-center">
              <span className="text-xs text-slate-500 font-mono w-5">{opt.id.toUpperCase()}.</span>
              <input
                value={opt.text}
                onChange={(e) => {
                  const next = [...options];
                  next[i] = { ...opt, text: e.target.value };
                  setOptions(next);
                }}
                className="flex-1 rounded bg-slate-900 border border-slate-700 px-2 py-1 text-sm text-white"
              />
              {type === 'single_choice' ? (
                <input
                  type="radio"
                  name="correct"
                  checked={correctAnswer === opt.id}
                  onChange={() => setCorrectAnswer(opt.id)}
                  className="accent-green-500"
                />
              ) : (
                <input
                  type="checkbox"
                  checked={Array.isArray(correctAnswer) && correctAnswer.includes(opt.id)}
                  onChange={(e) => {
                    const arr = Array.isArray(correctAnswer) ? [...correctAnswer] : [];
                    if (e.target.checked) arr.push(opt.id);
                    else {
                      const idx = arr.indexOf(opt.id);
                      if (idx >= 0) arr.splice(idx, 1);
                    }
                    setCorrectAnswer(arr);
                  }}
                  className="accent-green-500"
                />
              )}
            </div>
          ))}
          <p className="text-[10px] text-slate-500">{type === 'single_choice' ? 'Chọn đáp án đúng (radio)' : 'Chọn các đáp án đúng (checkbox)'}</p>
        </div>
      )}

      {type === 'short_answer' && (
        <label className="block">
          <span className="text-xs text-slate-400">Đáp án chấp nhận (phân cách bằng dấu phẩy)</span>
          <input
            value={Array.isArray(correctAnswer) ? correctAnswer.join(', ') : String(correctAnswer ?? '')}
            onChange={(e) => setCorrectAnswer(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
            className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-2 py-1 text-sm text-white"
          />
        </label>
      )}

      <label className="block">
        <span className="text-xs text-slate-400">Giải thích</span>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
        />
      </label>

      <label className="block">
        <span className="text-xs text-slate-400">Kỹ năng (phân cách dấu phẩy)</span>
        <input
          value={skillTags}
          onChange={(e) => setSkillTags(e.target.value)}
          className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-2 py-1 text-sm text-white"
          placeholder="luc, co-hoc"
        />
      </label>

      <div className="flex gap-2">
        <button type="button" onClick={handleSubmit} className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white min-h-[44px]">
          Xong
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]">
          Hủy
        </button>
      </div>
    </div>
  );
}
