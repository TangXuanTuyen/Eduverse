'use client';

import Link from 'next/link';
import type { GradingQueueItem } from '@/services/grading';
import { useLocale } from '@/components/i18n/LocaleProvider';

export function GradingQueue({ items }: { items: GradingQueueItem[] }) {
  const { t, locale } = useLocale();
  if (items.length === 0) {
    return (
      <div className="text-center text-slate-400 py-12">
        {t('grading.empty')}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400">{items.length} {t('grading.pendingUnit')}</p>
      {items.map((item) => (
        <Link
          key={item.submission_id}
          href={`/teacher/grading/${item.submission_id}`}
          className="block bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">{item.student_name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{item.assignment_title}</p>
            </div>
            <div className="text-xs text-slate-500">
              {item.submitted_at && new Date(item.submitted_at).toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
