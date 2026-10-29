'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Check, X } from 'lucide-react';
import { updateDisplayNameAction } from '@/app/profile/actions';

export function EditNameButton({ currentName, className = '' }: { currentName: string; className?: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentName);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function save() {
    setError('');
    startTransition(async () => {
      const result = await updateDisplayNameAction(value);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => { setValue(currentName); setEditing(true); }}
        aria-label="Chỉnh sửa tên"
        title="Chỉnh sửa tên"
        className={`min-w-11 min-h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 ${className}`}
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <div className={`flex flex-col gap-1 min-w-0 ${className}`}>
      <div className="flex items-center gap-1">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={40}
          aria-label="Tên hiển thị"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="min-w-0 flex-1 rounded-lg bg-slate-800 border border-slate-600 px-2 py-1 text-sm text-white min-h-11"
        />
        <button
          type="button"
          onClick={save}
          disabled={pending}
          aria-label="Lưu tên"
          className="min-w-11 min-h-11 flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          aria-label="Hủy"
          className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {error && <p className="text-[11px] text-rose-300">{error}</p>}
    </div>
  );
}
