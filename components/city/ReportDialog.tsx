'use client';

import React, { useState } from 'react';
import { DialogFrame } from '@/components/ui/DialogFrame';
import { X } from 'lucide-react';

const REASONS = [
  'Hành vi quấy rối',
  'Ngôn ngữ không phù hợp',
  'Spam biểu cảm',
  'Khác',
];

interface ReportDialogProps {
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export function ReportDialog({ onClose, onSubmit }: ReportDialogProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [custom, setCustom] = useState('');

  const reason = selected === 'Khác' ? custom : selected;
  const canSubmit = reason && reason.trim().length > 0;

  return (
    <DialogFrame onClose={onClose} labelledBy="report-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 id="report-title" className="text-sm font-bold text-white">Báo cáo bạn học</h3>
          <button type="button" onClick={onClose} aria-label="Đóng" className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-3">Báo cáo sẽ được gửi trực tiếp đến giáo viên quản lý lớp.</p>

        <div className="space-y-2 mb-4">
          {REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setSelected(r)}
              className={`w-full text-left text-xs px-3 py-2.5 rounded-lg border transition cursor-pointer min-h-[44px] ${
                selected === r
                  ? 'border-indigo-500 bg-indigo-950/40 text-white'
                  : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-600'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {selected === 'Khác' && (
          <textarea
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Mô tả ngắn gọn..."
            className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 mb-4 resize-none focus:outline-none focus:border-indigo-500"
          />
        )}

        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => reason && onSubmit(reason.trim())}
          className="w-full min-h-[44px] bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition cursor-pointer"
        >
          Gửi báo cáo
        </button>
      </div>
    </DialogFrame>
  );
}
