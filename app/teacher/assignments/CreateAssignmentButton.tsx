'use client';

import { useActionState, useState, useEffect } from 'react';
import { createAssignmentAction, type AssignmentActionState } from './actions';

type Room = { id: string; name: string };
type QuestionSet = {
  id: string;
  name: string;
  subject: string;
  grade: number | null;
  question_count: number;
  created_at: string;
};

export function CreateAssignmentButton({ teacherId }: { teacherId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<AssignmentActionState, FormData>(createAssignmentAction, {});
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState('');

  useEffect(() => {
    if (!open) return;
    fetch('/api/teacher/rooms').then((r) => r.json()).then((d) => setRooms(d.rooms ?? [])).catch(() => {});
    fetch('/api/teacher/sets').then((r) => r.json()).then((d) => setSets(d.sets ?? [])).catch(() => {});
  }, [open]);

  if (state.success) {
    if (open) {
      setTimeout(() => { setOpen(false); setSelectedSetId(''); }, 0);
    }
  }

  const selectedSet = sets.find((s) => s.id === selectedSetId);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-green-600 hover:bg-green-500 px-4 py-2 text-sm font-medium text-white min-h-[44px]"
      >
        Tạo bài giao
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
      <form action={formAction} className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-white">Tạo bài giao mới</h3>

        {state.error && <p className="text-red-400 text-sm">{state.error}</p>}

        <label className="block">
          <span className="text-xs text-slate-400">Phòng học</span>
          <select name="room_id" required className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white">
            <option value="">Chọn phòng...</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>

        <div>
          <span className="text-xs text-slate-400">Chọn bộ đề</span>
          <div className="mt-1 space-y-2 max-h-48 overflow-y-auto">
            {sets.length === 0 && (
              <p className="text-xs text-slate-500 p-3 bg-slate-800 rounded-lg border border-slate-700">
                Chưa có bộ đề. Vào Ngân hàng câu hỏi → Tạo bằng AI hoặc tạo bộ đề thủ công.
              </p>
            )}
            {sets.map((s) => (
              <label
                key={s.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  selectedSetId === s.id
                    ? 'bg-green-900/20 border-green-500/50'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="set_id"
                  value={s.id}
                  checked={selectedSetId === s.id}
                  onChange={() => setSelectedSetId(s.id)}
                  className="accent-green-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{s.name}</p>
                  <p className="text-xs text-slate-400">
                    {s.question_count} câu hỏi
                    {s.subject && ` · ${s.subject}`}
                    {s.grade && ` · Lớp ${s.grade}`}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-xs text-slate-400">Tiêu đề bài giao</span>
          <input
            name="title"
            type="text"
            required
            defaultValue={selectedSet?.name ?? ''}
            key={selectedSetId}
            className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white"
          />
        </label>

        <label className="block">
          <span className="text-xs text-slate-400">Mô tả (tuỳ chọn)</span>
          <textarea name="description" rows={2} className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white resize-y" />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-slate-400">Hạn nộp</span>
            <input name="due_at" type="datetime-local" className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">Nộp muộn</span>
            <select name="late_policy" className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white">
              <option value="hard_lock">Khóa khi hết hạn</option>
              <option value="marked_late">Cho nộp muộn</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-slate-400">Số lượt thử (0 = không giới hạn)</span>
            <input name="max_retries" type="number" min={0} max={10} defaultValue={0} className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">Hiện giải thích sau nộp</span>
            <select name="show_explanation" className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white">
              <option value="true">Có</option>
              <option value="false">Không</option>
            </select>
          </label>
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={pending || !selectedSetId} className="rounded-lg bg-green-600 hover:bg-green-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 min-h-[44px]">
            {pending ? 'Đang tạo...' : 'Giao bài'}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]">
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
