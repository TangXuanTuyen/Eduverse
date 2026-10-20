'use client';

import { useState } from 'react';
import { toggleModelPublishAction, deleteModelAction } from './actions';
import type { Model3DRow } from '@/services/models-3d';
import { Box, Eye, EyeOff, Trash2 } from 'lucide-react';

const SUBJECT_LABELS: Record<string, string> = {
  vat_ly: 'Vật lý', hoa_hoc: 'Hóa học', sinh_hoc: 'Sinh học', khtn_chung: 'KHTN chung',
};
const CATEGORY_LABELS: Record<string, string> = {
  te_bao: 'Tế bào', phan_tu: 'Phân tử', co_quan: 'Cơ quan',
  thiet_bi: 'Thiết bị', sinh_vat: 'Sinh vật', khac: 'Khác',
};

export function ModelList({ models }: { models: Model3DRow[] }) {
  const [list, setList] = useState(models);

  async function handleToggle(id: string, idx: number) {
    const result = await toggleModelPublishAction(id);
    if ('isPublished' in result) {
      setList((prev) =>
        prev.map((m, i) => (i === idx ? { ...m, is_published: result.isPublished as boolean } : m))
      );
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa mô hình này?')) return;
    const result = await deleteModelAction(id);
    if (result.success) setList((prev) => prev.filter((m) => m.id !== id));
  }

  if (list.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Box className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Chưa có mô hình 3D nào. Tạo mô hình đầu tiên!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {list.map((m, idx) => (
        <div
          key={m.id}
          className={`bg-slate-900 border rounded-lg p-4 flex items-center justify-between gap-4 ${
            m.is_published ? 'border-green-500/30' : 'border-slate-800'
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-medium truncate">{m.title}</h3>
              {m.is_published && (
                <span className="text-[10px] bg-green-900/50 text-green-400 px-1.5 py-0.5 rounded">Published</span>
              )}
            </div>
            <div className="flex gap-3 mt-1 text-xs text-slate-400">
              <span>{SUBJECT_LABELS[m.subject] ?? m.subject}</span>
              <span>Lớp {m.grade_level}</span>
              <span>{CATEGORY_LABELS[m.category] ?? m.category}</span>
              <span className="text-purple-400 truncate max-w-[250px]">{m.embed_url}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => handleToggle(m.id, idx)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title={m.is_published ? 'Ẩn' : 'Publish'}
            >
              {m.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              onClick={() => handleDelete(m.id)}
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
