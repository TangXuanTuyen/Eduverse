'use client';

import { useActionState, useState, useCallback } from 'react';
import { generateQuestionsAction, saveAIQuestionsAction, type AIGenerateState } from './ai-actions';
import type { CreateQuestionData } from '@/services/questions';
import { useLocale } from '@/components/i18n/LocaleProvider';

function useAILabels() {
  const { t } = useLocale();
  const subjects = [
    { id: 'vat-ly', name: t('ai.sub.vatly') },
    { id: 'hoa-hoc', name: t('ai.sub.hoahoc') },
    { id: 'sinh-hoc', name: t('ai.sub.sinhhoc') },
    { id: 'khtn', name: t('ai.sub.khtn') },
  ];
  const questionTypes = [
    { id: 'single_choice', name: t('ai.type.single') },
    { id: 'multiple_choice', name: t('ai.type.multi') },
    { id: 'short_answer', name: t('ai.type.short') },
    { id: 'essay', name: t('ai.type.essay') },
  ];
  const difficulties = [
    { id: 1, name: t('qf.diffEasy') },
    { id: 2, name: t('qf.diffMedium') },
    { id: 3, name: t('qf.diffHard') },
  ];
  const diffShort: Record<number, string> = { 1: t('qf.diffEasy'), 2: t('qs.diffMediumShort'), 3: t('qf.diffHard') };
  const typeShort: Record<string, string> = {
    single_choice: t('cs.typeSingleShort'),
    multiple_choice: t('cs.typeMultiShort'),
    short_answer: t('cs.typeShort'),
    essay: t('cs.typeEssayShort'),
  };
  return { t, subjects, questionTypes, difficulties, diffShort, typeShort };
}

type Props = { onClose: () => void };

export function AIGenerateDialog({ onClose }: Props) {
  const L = useAILabels();
  const { t } = L;
  const [state, formAction, pending] = useActionState<AIGenerateState, FormData>(generateQuestionsAction, {});
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ saved?: number; error?: string; setName?: string } | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedQuestions, setEditedQuestions] = useState<CreateQuestionData[]>([]);
  const [setName, setSetName] = useState('');

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
    const result = await saveAIQuestionsAction(JSON.stringify(toSave), setName);
    setSaving(false);
    setSaveResult(result);
  }

  if (saveResult?.saved) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <p className="text-green-400 text-sm">{t('ai.savedA')} {saveResult.saved} {t('ai.savedB')} &quot;{saveResult.setName || t('ai.defaultSet')}&quot;!</p>
        <p className="text-xs text-slate-400">{t('cs.goAssign')}</p>
        <button onClick={onClose} className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]">
          {t('cs.close')}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-4 space-y-4">
      <h3 className="font-bold text-white flex items-center gap-2">
        <span className="text-purple-400">✦</span> {t('ai.title')}
      </h3>
      <p className="text-xs text-slate-400">{t('ai.desc')}</p>

      {questions.length === 0 && (
        <form action={formAction} className="space-y-3">
          {state.error && <p className="text-red-400 text-sm">{state.error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-slate-400">{t('ai.subject')}</span>
              <select name="subject" required className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white">
                {L.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">{t('ai.grade')}</span>
              <select name="grade" className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white">
                {[6, 7, 8, 9].map((g) => <option key={g} value={g}>{t('ai.gradeWord')} {g}</option>)}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-xs text-slate-400">{t('ai.topic')}</span>
            <input
              name="topic"
              type="text"
              required
              placeholder={t('ai.topicPlaceholder')}
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white"
            />
          </label>

          <fieldset>
            <legend className="text-xs text-slate-400 mb-1">{t('ai.types')}</legend>
            <div className="flex flex-wrap gap-2">
              {L.questionTypes.map((q) => (
                <label key={q.id} className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white cursor-pointer hover:border-purple-500/50 has-[:checked]:border-purple-500 has-[:checked]:bg-purple-900/20">
                  <input type="checkbox" name="types" value={q.id} defaultChecked={q.id === 'single_choice'} className="accent-purple-500" />
                  {q.name}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs text-slate-400 mb-1">{t('ai.difficulties')}</legend>
            <div className="flex flex-wrap gap-2">
              {L.difficulties.map((d) => (
                <label key={d.id} className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white cursor-pointer hover:border-purple-500/50 has-[:checked]:border-purple-500 has-[:checked]:bg-purple-900/20">
                  <input type="checkbox" name="difficulties" value={d.id} defaultChecked={d.id === 2} className="accent-purple-500" />
                  {d.name}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="text-xs text-slate-400">{t('ai.count')}</span>
            <input name="count" type="number" min={1} max={20} defaultValue={5} className="mt-1 w-24 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white" />
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-purple-600 hover:bg-purple-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 min-h-[44px]"
            >
              {pending ? t('ai.generating') : t('ai.create')}
            </button>
            <button type="button" onClick={onClose} className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]">
              {t('cs.cancel')}
            </button>
          </div>
        </form>
      )}

      {questions.length > 0 && (
        <div className="space-y-3">
          {saveResult?.error && <p className="text-red-400 text-sm">{saveResult.error}</p>}

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">{t('ai.generatedA')} {questions.length} {t('ai.generatedB')}</p>
            <button
              type="button"
              onClick={() => setSelected(selected.size === questions.length ? new Set() : new Set(questions.map((_, i) => i)))}
              className="text-xs text-purple-400 hover:underline"
            >
              {selected.size === questions.length ? t('cs.unselectAll') : t('cs.selectAll')}
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

          <label className="block">
            <span className="text-xs text-slate-400">{t('cs.name')}</span>
            <input
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              placeholder={t('ai.setPlaceholder')}
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || selected.size === 0}
              className="rounded-lg bg-green-600 hover:bg-green-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 min-h-[44px]"
            >
              {saving ? t('qf.saving') : `${t('ai.saveA')} ${selected.size} ${t('ai.saveB')}`}
            </button>
            <button
              type="button"
              onClick={() => { setEditedQuestions([]); setSelected(new Set()); }}
              className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]"
            >
              {t('ai.regenerate')}
            </button>
            <button type="button" onClick={onClose} className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]">
              {t('cs.cancel')}
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
  const L = useAILabels();
  const { t } = L;
  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg transition ${selected ? 'bg-purple-900/20 border border-purple-500/30' : 'bg-slate-800 border border-slate-700'}`}>
      <input type="checkbox" checked={selected} onChange={onToggle} className="mt-1 cursor-pointer" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] bg-purple-800/50 text-purple-300 px-1.5 rounded">{L.typeShort[q.type] ?? q.type}</span>
          <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 rounded">{L.diffShort[q.difficulty ?? 1] ?? q.difficulty}</span>
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
          <p className="text-xs text-slate-500 mt-1 italic">{t('ai.explainPrefix')}: {q.explanation}</p>
        )}
        {q.skill_tags && q.skill_tags.length > 0 && (
          <div className="flex gap-1 mt-1">
            {q.skill_tags.map((s) => (
              <span key={s} className="text-[10px] bg-slate-700 text-slate-400 px-1 rounded">{s}</span>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 text-xs text-blue-400 hover:text-blue-300 hover:underline mt-1 min-h-[44px] px-2"
      >
        {t('qs.edit')}
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
  const L = useAILabels();
  const { t } = L;
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
      <div className="flex items-center gap-2 text-xs text-blue-400 font-medium">{t('ai.editing')}</div>

      <label className="block">
        <span className="text-xs text-slate-400">{t('ai.content')}</span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-slate-400">{t('ai.typeLabel')}</span>
          <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white">
            {L.questionTypes.map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-slate-400">{t('ai.diffLabel')}</span>
          <select value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))} className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white">
            {L.difficulties.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>
      </div>

      {isChoice && (
        <div className="space-y-2">
          <span className="text-xs text-slate-400">{t('ai.choices')}</span>
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
          <p className="text-[10px] text-slate-500">{type === 'single_choice' ? t('ai.radioHint') : t('ai.checkHint')}</p>
        </div>
      )}

      {type === 'short_answer' && (
        <label className="block">
          <span className="text-xs text-slate-400">{t('ai.acceptAnswers')}</span>
          <input
            value={Array.isArray(correctAnswer) ? correctAnswer.join(', ') : String(correctAnswer ?? '')}
            onChange={(e) => setCorrectAnswer(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
            className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-2 py-1 text-sm text-white"
          />
        </label>
      )}

      <label className="block">
        <span className="text-xs text-slate-400">{t('ai.explainLabel')}</span>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
        />
      </label>

      <label className="block">
        <span className="text-xs text-slate-400">{t('qf.skills')}</span>
        <input
          value={skillTags}
          onChange={(e) => setSkillTags(e.target.value)}
          className="mt-1 w-full rounded bg-slate-900 border border-slate-700 px-2 py-1 text-sm text-white"
          placeholder="luc, co-hoc"
        />
      </label>

      <div className="flex gap-2">
        <button type="button" onClick={handleSubmit} className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white min-h-[44px]">
          {t('ai.done')}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]">
          {t('cs.cancel')}
        </button>
      </div>
    </div>
  );
}
