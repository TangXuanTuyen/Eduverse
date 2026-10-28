'use client';

import { LOCALES, type Locale } from '@/lib/i18n/dict';
import { useLocale } from '@/components/i18n/LocaleProvider';

const LABEL: Record<Locale, string> = { vi: 'VI', en: 'EN' };

export function LanguageSwitch({ className = '' }: { className?: string }) {
  const { locale, setLocale, t, pending } = useLocale();
  return (
    <div role="group" aria-label={t('shell.language')} className={`inline-flex rounded-lg bg-slate-800/60 p-0.5 ${className}`}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          disabled={pending}
          className={`min-h-11 min-w-11 px-3 rounded-md text-xs font-semibold transition-colors disabled:opacity-60 ${
            locale === l ? 'bg-indigo-600/40 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          {LABEL[l]}
        </button>
      ))}
    </div>
  );
}
