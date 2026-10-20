'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { createLessonAction } from './actions';

export function CreateLessonForm() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    const result = await createLessonAction(fd);
    setSubmitting(false);
    if ('error' in result && result.error) {
      setError(result.error);
    } else {
      setOpen(false);
      window.location.reload();
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-sm font-medium text-white flex items-center gap-1.5 min-h-[44px]"
      >
        <Plus size={16} /> Tạo bài học
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Tạo bài học mới</h2>
          <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <input name="title" placeholder="Tiêu đề" required className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white" />
        <textarea name="description" placeholder="Mô tả (tùy chọn)" rows={2} className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white resize-none" />

        <div className="grid grid-cols-2 gap-3">
          <select name="subject" required className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white min-h-[44px]">
            <option value="">Môn...</option>
            <option value="sinh_hoc">Sinh học</option>
            <option value="vat_ly">Vật lý</option>
            <option value="hoa_hoc">Hóa học</option>
            <option value="khtn_chung">KHTN chung</option>
          </select>
          <select name="grade_level" required className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white min-h-[44px]">
            <option value="6">Lớp 6</option>
            <option value="7">Lớp 7</option>
            <option value="8">Lớp 8</option>
            <option value="9">Lớp 9</option>
          </select>
        </div>

        <input name="chapter" placeholder="Chương (VD: Chương 1 - Tế bào)" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white" />

        <div>
          <label className="block text-xs text-slate-400 mb-1">Nội dung (JSON — 5 bước theo schema)</label>
          <textarea
            name="content"
            rows={6}
            defaultValue="[]"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-mono text-white resize-none"
            placeholder='[{"title":"Khởi động","phase":"khoi_dong","blocks":[{"type":"text","content":"..."}]}]'
          />
          <p className="text-[10px] text-slate-500 mt-1">
            ⚠ Nội dung khoa học cần giáo viên kiểm tra trước khi xuất bản
          </p>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 min-h-[44px]"
        >
          {submitting ? 'Đang tạo...' : 'Tạo bài học'}
        </button>
      </form>
    </div>
  );
}
