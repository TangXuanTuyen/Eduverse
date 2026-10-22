'use client';

import { useState, useEffect } from 'react';

type QuestionSet = { id: string; name: string; question_count: number };

export function MeCungCard() {
  const [open, setOpen] = useState(false);
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState('');

  useEffect(() => {
    if (!open) return;
    fetch('/api/teacher/sets')
      .then((r) => r.json())
      .then((d) => setSets(d.sets ?? []))
      .catch(() => {});
  }, [open]);

  function handleStart() {
    if (!selectedSetId) return;
    window.open(`/games/me-cung/index.html?setId=${selectedSetId}`, '_blank');
    setOpen(false);
    setSelectedSetId('');
  }

  return (
    <>
      <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl p-4 hover:border-cyan-500/40 transition">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center text-2xl shrink-0">
            🎮
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white">Mê Cung Tri Thức</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Robot Vina khám phá mê cung, giải câu hỏi để mở khóa cổng. Chọn bộ câu hỏi sẵn có để tổ chức tại lớp.
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-sm font-medium text-white min-h-[44px] transition-colors"
          >
            Tổ chức tại lớp
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Tổ chức Mê Cung Tri Thức</h3>
            <p className="text-sm text-slate-400">Chọn bộ câu hỏi để chèn vào trò chơi. Câu hỏi mẫu sẽ được thay bằng bộ đề bạn chọn.</p>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sets.length === 0 && (
                <p className="text-xs text-slate-500 p-3 bg-slate-800 rounded-lg border border-slate-700">
                  Chưa có bộ đề. Vào Ngân hàng câu hỏi để tạo bộ đề trước.
                </p>
              )}
              {sets.map((s) => (
                <label
                  key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    selectedSetId === s.id
                      ? 'bg-cyan-900/20 border-cyan-500/50'
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="set_id"
                    value={s.id}
                    checked={selectedSetId === s.id}
                    onChange={() => setSelectedSetId(s.id)}
                    className="accent-cyan-500"
                  />
                  <div>
                    <p className="text-sm text-white">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.question_count} câu hỏi</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleStart}
                disabled={!selectedSetId}
                className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 min-h-[44px] transition-colors"
              >
                Mở trò chơi
              </button>
              <button
                onClick={() => { setOpen(false); setSelectedSetId(''); }}
                className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
