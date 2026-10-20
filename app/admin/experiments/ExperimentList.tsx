'use client';

import { useState } from 'react';
import { togglePublishAction, deleteExperimentAction } from './actions';
import type { ExperimentRow } from '@/services/experiments';
import { FlaskConical, Eye, EyeOff, Trash2 } from 'lucide-react';

const SUBJECT_LABELS: Record<string, string> = {
  vat_ly: 'Vật lý',
  hoa_hoc: 'Hóa học',
  sinh_hoc: 'Sinh học',
  khtn_chung: 'KHTN chung',
};
const DIFF_LABELS: Record<number, string> = { 1: 'Dễ', 2: 'Trung bình', 3: 'Khó' };

export function ExperimentList({ experiments }: { experiments: ExperimentRow[] }) {
  const [list, setList] = useState(experiments);

  async function handleToggle(id: string, idx: number) {
    const result = await togglePublishAction(id);
    if ('isPublished' in result) {
      setList((prev) =>
        prev.map((e, i) => (i === idx ? { ...e, is_published: result.isPublished as boolean } : e))
      );
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa thí nghiệm này?')) return;
    const result = await deleteExperimentAction(id);
    if (result.success) {
      setList((prev) => prev.filter((e) => e.id !== id));
    }
  }

  if (list.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Chưa có thí nghiệm nào. Tạo thí nghiệm đầu tiên!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {list.map((exp, idx) => (
        <div
          key={exp.id}
          className={`bg-slate-900 border rounded-lg p-4 flex items-center justify-between gap-4 ${
            exp.is_published ? 'border-green-500/30' : 'border-slate-800'
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-medium truncate">{exp.title}</h3>
              {exp.is_published && (
                <span className="text-[10px] bg-green-900/50 text-green-400 px-1.5 py-0.5 rounded">Published</span>
              )}
            </div>
            <div className="flex gap-3 mt-1 text-xs text-slate-400">
              <span>{SUBJECT_LABELS[exp.subject] ?? exp.subject}</span>
              <span>Lớp {exp.grade_level}</span>
              <span>{DIFF_LABELS[exp.difficulty] ?? '?'}</span>
              <span>{exp.duration_minutes} phút</span>
              {exp.component_key && <span className="text-cyan-400">Built-in: {exp.component_key}</span>}
              {exp.embed_url && <span className="text-purple-400 truncate max-w-[200px]">URL: {exp.embed_url}</span>}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => handleToggle(exp.id, idx)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title={exp.is_published ? 'Ẩn' : 'Publish'}
            >
              {exp.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              onClick={() => handleDelete(exp.id)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400"
              title="Xóa"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
