'use client';

import { useState, useCallback } from 'react';
import { ClipboardList, Save } from 'lucide-react';
import type { ObservationBlock } from '@/lib/lessons/schema';

type Props = {
  block: ObservationBlock;
  lessonId: string;
  stepIndex: number;
  initial?: { prediction: string; observation: string; explanation: string };
  onSave: (data: { prediction: string; observation: string; explanation: string }) => void;
};

export function ObservationSheet({ block, initial, onSave }: Props) {
  const [prediction, setPrediction] = useState(initial?.prediction ?? '');
  const [observation, setObservation] = useState(initial?.observation ?? '');
  const [explanation, setExplanation] = useState(initial?.explanation ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    onSave({ prediction, observation, explanation });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [prediction, observation, explanation, onSave]);

  return (
    <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2 text-emerald-400">
        <ClipboardList size={18} />
        <span className="font-bold text-sm">Phiếu quan sát</span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-emerald-300 mb-1">
            {block.promptPrediction}
          </label>
          <textarea
            value={prediction}
            onChange={(e) => setPrediction(e.target.value)}
            rows={2}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none resize-none"
            placeholder="Ghi dự đoán của bạn..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-emerald-300 mb-1">
            {block.promptObservation}
          </label>
          <textarea
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none resize-none"
            placeholder="Ghi quan sát..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-emerald-300 mb-1">
            {block.promptExplanation}
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={2}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none resize-none"
            placeholder="Giải thích..."
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-medium text-white flex items-center gap-1.5 min-h-[44px] disabled:opacity-50"
      >
        <Save size={14} />
        {saved ? 'Đã lưu!' : saving ? '...' : 'Lưu phiếu'}
      </button>
    </div>
  );
}
