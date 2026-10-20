'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { createExperimentAction } from './actions';

export function CreateExperimentForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const result = await createExperimentAction(null, formData);
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
        className="rounded-lg bg-green-600 hover:bg-green-500 px-4 py-2 text-sm font-medium text-white flex items-center gap-1.5 min-h-[44px]"
      >
        <Plus size={16} /> Tạo thí nghiệm
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
          <h2 className="text-lg font-bold text-white">Tạo thí nghiệm mới</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Tên thí nghiệm *</label>
          <input name="title" required className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm min-h-[44px]" />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Mô tả</label>
          <textarea name="description" rows={2} className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Môn *</label>
            <select name="subject" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm min-h-[44px]">
              <option value="vat_ly">Vật lý</option>
              <option value="hoa_hoc">Hóa học</option>
              <option value="sinh_hoc">Sinh học</option>
              <option value="khtn_chung">KHTN chung</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Lớp *</label>
            <select name="grade_level" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm min-h-[44px]">
              <option value="6">Lớp 6</option>
              <option value="7">Lớp 7</option>
              <option value="8">Lớp 8</option>
              <option value="9">Lớp 9</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">URL embed (iframe)</label>
          <input name="embed_url" placeholder="https://..." className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm min-h-[44px]" />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Component key (built-in)</label>
          <input name="component_key" placeholder="VD: litmus, circuit, microscope" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm min-h-[44px]" />
          <p className="text-[10px] text-slate-500 mt-0.5">Dùng cho TN built-in. Để trống nếu dùng URL embed.</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Thời gian (phút)</label>
            <input name="duration_minutes" type="number" defaultValue={15} min={1} max={120} className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm min-h-[44px]" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Độ khó</label>
            <select name="difficulty" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm min-h-[44px]">
              <option value="1">Dễ</option>
              <option value="2">Trung bình</option>
              <option value="3">Khó</option>
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
          className="w-full rounded-lg bg-green-600 hover:bg-green-500 py-2.5 text-sm font-medium text-white disabled:opacity-50 min-h-[44px]"
        >
          {loading ? 'Đang tạo...' : 'Tạo thí nghiệm'}
        </button>
      </form>
    </div>
  );
}
