'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { createModelAction } from './actions';

export function CreateModelForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const result = await createModelAction(null, formData);
    setLoading(false);
    if ('error' in result && result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-purple-600 hover:bg-purple-500 px-4 py-2 text-sm font-medium text-white flex items-center gap-1.5 min-h-[44px]"
      >
        <Plus size={16} /> Thêm mô hình 3D
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Thêm mô hình 3D</h2>
          <button type="button" onClick={() => setOpen(false)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Tên mô hình *</label>
          <input name="title" required className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm min-h-[44px]" />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Mô tả</label>
          <textarea name="description" rows={2} className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">URL embed * (Sketchfab, three.js, hoặc URL iframe)</label>
          <input name="embed_url" required placeholder="https://sketchfab.com/models/.../embed" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm min-h-[44px]" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Môn</label>
            <select name="subject" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm min-h-[44px]">
              <option value="sinh_hoc">Sinh học</option>
              <option value="hoa_hoc">Hóa học</option>
              <option value="vat_ly">Vật lý</option>
              <option value="khtn_chung">KHTN chung</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Lớp</label>
            <select name="grade_level" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm min-h-[44px]">
              <option value="6">Lớp 6</option>
              <option value="7">Lớp 7</option>
              <option value="8">Lớp 8</option>
              <option value="9">Lớp 9</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Danh mục</label>
            <select name="category" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm min-h-[44px]">
              <option value="te_bao">Tế bào</option>
              <option value="phan_tu">Phân tử</option>
              <option value="co_quan">Cơ quan</option>
              <option value="thiet_bi">Thiết bị</option>
              <option value="sinh_vat">Sinh vật</option>
              <option value="khac">Khác</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Ảnh đại diện</label>
            <input name="thumbnail_url" placeholder="URL ảnh" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm min-h-[44px]" />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-purple-600 hover:bg-purple-500 py-2.5 text-sm font-medium text-white disabled:opacity-50 min-h-[44px]"
        >
          {loading ? 'Đang tạo...' : 'Thêm mô hình'}
        </button>
      </form>
    </div>
  );
}
