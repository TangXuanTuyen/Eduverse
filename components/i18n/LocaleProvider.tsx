'use client';

import { createContext, useCallback, useContext, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  DICTS,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  translate,
  type DictKey,
  type Locale,
} from '@/lib/i18n/dict';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: DictKey) => string;
  pending: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const setLocale = useCallback(
    (next: Locale) => {
      try {
        document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      } catch {
        return;
      }
      startTransition(() => router.refresh());
    },
    [router],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => translate(locale, key),
      pending,
    }),
    [locale, setLocale, pending],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (ctx) return ctx;
  return {
    locale: DEFAULT_LOCALE,
    setLocale: () => {},
    t: (key) => DICTS[DEFAULT_LOCALE][key],
    pending: false,
  };
}
