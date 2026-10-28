'use client';

import { useActionState, useRef, useState } from 'react';
import { importQuestionsAction, type QuestionActionState } from './actions';
import type { CreateQuestionData } from '@/services/questions';
import { useLocale } from '@/components/i18n/LocaleProvider';

type Props = { onClose: () => void };

export function ImportDialog({ onClose }: Props) {
  const { t } = useLocale();
  const [state, formAction, pending] = useActionState<QuestionActionState, FormData>(importQuestionsAction, {});
  const [rows, setRows] = useState<CreateQuestionData[]>([]);
  const [parseError, setParseError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setParseError('');
    try {
      const text = await file.text();

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        setRows(Array.isArray(parsed) ? parsed : [parsed]);
        return;
      }

      // CSV: header row + data rows
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length < 2) { setParseError(t('im.needTwo')); return; }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const contentIdx = headers.indexOf('content');
      const typeIdx = headers.indexOf('type');
      if (contentIdx < 0) { setParseError(t('im.missingContent')); return; }

      const parsed: CreateQuestionData[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim());
        if (!cols[contentIdx]) continue;
        parsed.push({
          type: (typeIdx >= 0 ? cols[typeIdx] : 'essay') as CreateQuestionData['type'],
          content: cols[contentIdx],
          difficulty: Number(cols[headers.indexOf('difficulty')]) || 1,
          skill_tags: cols[headers.indexOf('skill_tags')]?.split(';').filter(Boolean) ?? [],
        });
      }
      setRows(parsed);
    } catch {
      setParseError(t('im.readError'));
    }
  }

  if (state.success) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <p className="text-green-400 text-sm">{state.success}</p>
        <button onClick={onClose} className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]">
          {t('im.close')}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
      <h3 className="font-bold text-white">{t('im.title')}</h3>
      <p className="text-xs text-slate-400">{t('im.desc')}</p>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,.json"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="text-sm text-slate-300"
      />

      {parseError && <p className="text-red-400 text-sm">{parseError}</p>}
      {state.error && <p className="text-red-400 text-sm">{state.error}</p>}

      {rows.length > 0 && (
        <>
          <div className="bg-slate-800 rounded-lg p-3 max-h-48 overflow-y-auto">
            <p className="text-xs text-slate-400 mb-2">{rows.length} {t('im.willImport')}</p>
            <ul className="space-y-1">
              {rows.slice(0, 20).map((r, i) => (
                <li key={i} className="text-xs text-white truncate">
                  {i + 1}. [{r.type}] {r.content}
                </li>
              ))}
              {rows.length > 20 && <li className="text-xs text-slate-400">{t('im.andMoreA')} {rows.length - 20} {t('im.andMoreB')}</li>}
            </ul>
          </div>

          <form action={formAction}>
            <input type="hidden" name="data" value={JSON.stringify(rows)} />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-green-600 hover:bg-green-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 min-h-[44px]"
              >
                {pending ? t('im.importing') : `${t('im.import')} ${rows.length} ${t('im.questionsUnit')}`}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]"
              >
                {t('im.cancel')}
              </button>
            </div>
          </form>
        </>
      )}

      {rows.length === 0 && (
        <button onClick={onClose} className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]">
          {t('im.cancel')}
        </button>
      )}
    </div>
  );
}
