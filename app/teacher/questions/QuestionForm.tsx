'use client';

import { useActionState, useState, lazy, Suspense } from 'react';
import { createQuestionAction, updateQuestionAction, type QuestionActionState } from './actions';
import type { QuestionWithAnswer } from '@/services/questions';
import { useLocale } from '@/components/i18n/LocaleProvider';

const InlineMath = lazy(() => import('react-katex').then((m) => ({ default: m.InlineMath })));
const BlockMath = lazy(() => import('react-katex').then((m) => ({ default: m.BlockMath })));

type Props = {
  editing?: QuestionWithAnswer;
  onDone?: () => void;
};

export function QuestionForm({ editing, onDone }: Props) {
  const { t } = useLocale();
  const TYPE_LABELS: Record<string, string> = {
    single_choice: t('qf.typeSingle'),
    multiple_choice: t('qf.typeMultiple'),
    short_answer: t('qf.typeShort'),
    essay: t('qf.typeEssay'),
  };
  const DIFFICULTY_LABELS = ['', t('qf.diffEasy'), t('qf.diffMedium'), t('qf.diffHard')];
  const action = editing ? updateQuestionAction : createQuestionAction;
  const [state, formAction, pending] = useActionState<QuestionActionState, FormData>(action, {});
  const [type, setType] = useState<string>(editing?.type ?? 'single_choice');
  const [content, setContent] = useState(editing?.content ?? '');
  const [showPreview, setShowPreview] = useState(false);
  const isChoice = type === 'single_choice' || type === 'multiple_choice';

  if (state.success && onDone) {
    setTimeout(onDone, 0);
  }

  return (
    <form action={formAction} className="space-y-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
      <h3 className="font-bold text-white">{editing ? t('qf.editTitle') : t('qf.newTitle')}</h3>

      {editing && <input type="hidden" name="questionId" value={editing.id} />}

      {state.error && <p className="text-red-400 text-sm">{state.error}</p>}
      {state.success && <p className="text-green-400 text-sm">{state.success}</p>}

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-slate-400">{t('qf.questionType')}</span>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white"
          >
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs text-slate-400">{t('qf.difficulty')}</span>
          <select
            name="difficulty"
            defaultValue={editing?.difficulty ?? 1}
            className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white"
          >
            {[1, 2, 3].map((d) => (
              <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-xs text-slate-400">
          {t('qf.content')}
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="ml-2 text-blue-400 hover:underline"
          >
            {showPreview ? t('qf.hidePreview') : t('qf.showPreview')} {t('qf.katex')}
          </button>
        </span>
        <textarea
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          required
          className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white resize-y"
          placeholder={t('qf.contentPlaceholder')}
        />
      </label>

      {showPreview && content && (
        <div className="bg-slate-800 rounded-lg p-3 text-sm text-white">
          <Suspense fallback={<span className="text-slate-400">{t('qf.loadingKatex')}</span>}>
            <KaTeXPreview text={content} />
          </Suspense>
        </div>
      )}

      {isChoice && (
        <>
          <label className="block">
            <span className="text-xs text-slate-400">{t('qf.options')}</span>
            <textarea
              name="options"
              rows={4}
              defaultValue={
                editing?.options
                  ? editing.options.map((o) => o.text).join('\n')
                  : ''
              }
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white resize-y font-mono"
              placeholder={'Newton\nJoule\nWatt'}
            />
          </label>

          <label className="block">
            <span className="text-xs text-slate-400">
              {t('qf.correct')} ({type === 'single_choice' ? t('qf.letterSingle') : t('qf.letterMulti')})
            </span>
            <input
              name="correct_answer"
              type="text"
              defaultValue={
                editing?.correct_answer != null
                  ? typeof editing.correct_answer === 'string'
                    ? editing.correct_answer
                    : JSON.stringify(editing.correct_answer)
                  : ''
              }
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white"
              placeholder={type === 'single_choice' ? 'a' : '["a","c"]'}
            />
          </label>
        </>
      )}

      {type === 'short_answer' && (
        <label className="block">
          <span className="text-xs text-slate-400">{t('qf.correctPipe')}</span>
          <input
            name="correct_answer"
            type="text"
            defaultValue={
              editing?.correct_answer != null
                ? Array.isArray(editing.correct_answer)
                  ? (editing.correct_answer as string[]).join(' | ')
                  : String(editing.correct_answer)
                : ''
            }
            className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white"
            placeholder="Newton | N"
          />
        </label>
      )}

      <label className="block">
        <span className="text-xs text-slate-400">{t('qf.skills')}</span>
        <input
          name="skill_tags"
          type="text"
          defaultValue={editing?.skill_tags?.join(', ') ?? ''}
          className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white"
          placeholder={t('qf.skillsPlaceholder')}
        />
      </label>

      <label className="block">
        <span className="text-xs text-slate-400">{t('qf.explanation')}</span>
        <textarea
          name="explanation"
          rows={2}
          defaultValue={editing?.explanation ?? ''}
          className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white resize-y"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-green-600 hover:bg-green-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 min-h-[44px]"
        >
          {pending ? t('qf.saving') : editing ? t('qf.update') : t('qf.create')}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]"
          >
            {t('qf.cancel')}
          </button>
        )}
      </div>
    </form>
  );
}

function KaTeXPreview({ text }: { text: string }) {
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g);
  return (
    <div>
      {parts.map((part, i) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          return <BlockMath key={i} math={part.slice(2, -2)} />;
        }
        if (part.startsWith('$') && part.endsWith('$')) {
          return <InlineMath key={i} math={part.slice(1, -1)} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}
