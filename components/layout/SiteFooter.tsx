'use client';

import { Mail, Phone } from 'lucide-react';
import { useLocale } from '@/components/i18n/LocaleProvider';

export function SiteFooter() {
  const { t } = useLocale();
  return (
    <footer className="w-full border-t border-slate-800/60 bg-slate-900/40 px-4 py-3 text-xs text-slate-400">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-center">
        <span className="font-semibold text-slate-200">{t('footer.vina')}</span>
        <a href="tel:0964022270" className="inline-flex items-center gap-1.5 min-h-11 hover:text-white transition-colors">
          <Phone className="w-3.5 h-3.5" /> {t('footer.hotline')}: 0964022270
        </a>
        <a href="mailto:xuantuyen96@gmail.com" className="inline-flex items-center gap-1.5 min-h-11 hover:text-white transition-colors">
          <Mail className="w-3.5 h-3.5" /> {t('footer.email')}: xuantuyen96@gmail.com
        </a>
        <span>{t('footer.developedBy')}: Tăng Thị Xuân Tuyền</span>
      </div>
    </footer>
  );
}
