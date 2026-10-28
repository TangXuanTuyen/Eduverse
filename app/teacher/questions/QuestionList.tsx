'use client';

import { useActionState, useState } from 'react';
import { deleteQuestionAction, type QuestionActionState } from './actions';
import { QuestionForm } from './QuestionForm';
import type { QuestionRow, QuestionWithAnswer } from '@/services/questions';
import { useLocale } from '@/components/i18n/LocaleProvider';

const DIFF_COLORS = ['', 'text-green-400', 'text-yellow-400', 'text-red-400'];

function useQuestionLabels() {
  const { t } = useLocale();
  return {
    types: {
      single_choice: t('qs.typeSingle'),
      multiple_choice: t('qs.typeMultiple'),
      short_answer: t('qs.typeShort'),
      essay: t('qs.typeEssay'),
    } as Record<string, string>,
    diffs: ['', t('qs.diffEasy'), t('qs.diffMediumShort'), t('qs.diffHard')],
  };
}

type Props = {
  questions: QuestionRow[];
  total: number;
  page: number;
  limit: number;
};

export function QuestionList({ questions, total, page, limit }: Props) {
  const { t } = useLocale();
  const [editingId, setEditingId] = useState<string | null>(null);
  const totalPages = Math.ceil(total / limit);

  if (questions.length === 0) {
    return (
      <div className="text-center text-slate-400 py-12">
        {t('qs.empty')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">{total} {t('qs.unit')} · {t('qs.page')} {page}/{totalPages}</p>

      {questions.map((q) => (
        <div key={q.id}>
          {editingId === q.id ? (
            <QuestionForm
              editing={q as QuestionWithAnswer}
              onDone={() => setEditingId(null)}
            />
          ) : (
            <QuestionCard
              question={q}
              onEdit={() => setEditingId(q.id)}
            />
          )}
        </div>
      ))}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`?page=${p}`}
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-sm ${
                p === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionCard({ question: q, onEdit }: { question: QuestionRow; onEdit: () => void }) {
  const { t } = useLocale();
  const labels = useQuestionLabels();
  const [delState, delAction, delPending] = useActionState<QuestionActionState, FormData>(deleteQuestionAction, {});

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
              {labels.types[q.type] ?? q.type}
            </span>
            <span className={`text-xs ${DIFF_COLORS[q.difficulty]}`}>
              {labels.diffs[q.difficulty]}
            </span>
            {q.skill_tags?.map((t) => (
              <span key={t} className="text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                {t}
              </span>
            ))}
          </div>
          <p className="text-white text-sm line-clamp-2">{q.content}</p>
        </div>

        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-300"
          >
            {t('qs.edit')}
          </button>
          <form action={delAction}>
            <input type="hidden" name="questionId" value={q.id} />
            <button
              type="submit"
              disabled={delPending}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-slate-800 hover:bg-red-900 text-sm text-slate-300 disabled:opacity-50"
            >
              {t('qs.delete')}
            </button>
          </form>
        </div>
      </div>

      {delState.error && <p className="text-red-400 text-xs mt-2">{delState.error}</p>}
    </div>
  );
}
