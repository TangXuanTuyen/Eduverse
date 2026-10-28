'use client';

import { useState } from 'react';
import { QuestionForm } from './QuestionForm';
import { ImportDialog } from './ImportDialog';
import { AIGenerateDialog } from './AIGenerateDialog';
import { CreateSetDialog } from './CreateSetDialog';
import { useLocale } from '@/components/i18n/LocaleProvider';

export function QuestionToolbar() {
  const { t } = useLocale();
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showSet, setShowSet] = useState(false);

  const closeAll = () => { setShowCreate(false); setShowImport(false); setShowAI(false); setShowSet(false); };

  return (
    <div className="space-y-3">
      {/* Filters */}
      <form className="flex flex-wrap gap-2">
        <input
          name="search"
          type="text"
          placeholder={t('qs.search')}
          className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white min-h-[44px] flex-1 min-w-[160px]"
        />
        <select
          name="type"
          defaultValue=""
          className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white min-h-[44px]"
        >
          <option value="">{t('qs.allTypes')}</option>
          <option value="single_choice">{t('qs.typeSingle')}</option>
          <option value="multiple_choice">{t('qs.typeMultiple')}</option>
          <option value="short_answer">{t('qs.typeShort')}</option>
          <option value="essay">{t('qs.typeEssay')}</option>
        </select>
        <select
          name="difficulty"
          defaultValue=""
          className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white min-h-[44px]"
        >
          <option value="">{t('qs.allDiff')}</option>
          <option value="1">{t('qs.diffEasy')}</option>
          <option value="2">{t('qs.diffMedium')}</option>
          <option value="3">{t('qs.diffHard')}</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white min-h-[44px]"
        >
          {t('qs.filter')}
        </button>
      </form>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { closeAll(); setShowCreate(!showCreate); }}
          className="rounded-lg bg-green-600 hover:bg-green-500 px-4 py-2 text-sm font-medium text-white min-h-[44px]"
        >
          {showCreate ? t('qs.hideForm') : t('qs.createQuestion')}
        </button>
        <button
          type="button"
          onClick={() => { closeAll(); setShowAI(!showAI); }}
          className="rounded-lg bg-purple-600 hover:bg-purple-500 px-4 py-2 text-sm font-medium text-white min-h-[44px]"
        >
          {showAI ? t('qs.hide') : t('qs.createAI')}
        </button>
        <button
          type="button"
          onClick={() => { closeAll(); setShowSet(!showSet); }}
          className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-sm font-medium text-white min-h-[44px]"
        >
          {showSet ? t('qs.hide') : t('qs.createSet')}
        </button>
        <button
          type="button"
          onClick={() => { closeAll(); setShowImport(!showImport); }}
          className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]"
        >
          {showImport ? t('qs.hide') : t('qs.import')}
        </button>
      </div>

      {showCreate && <QuestionForm onDone={() => setShowCreate(false)} />}
      {showAI && <AIGenerateDialog onClose={() => setShowAI(false)} />}
      {showSet && <CreateSetDialog onClose={() => setShowSet(false)} />}
      {showImport && <ImportDialog onClose={() => setShowImport(false)} />}
    </div>
  );
}
