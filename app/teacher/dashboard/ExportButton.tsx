'use client';

import { useState } from 'react';
import { useLocale } from '@/components/i18n/LocaleProvider';

export function ExportButton({ assignmentId }: { assignmentId: string }) {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/export?assignment=${assignmentId}`);
      if (!res.ok) throw new Error('Lỗi xuất file');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bao-cao-${assignmentId.slice(0, 8)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert(t('dash.exportError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white disabled:opacity-50 min-h-[44px] shrink-0"
    >
      {loading ? t('dash.exporting') : t('dash.export')}
    </button>
  );
}
