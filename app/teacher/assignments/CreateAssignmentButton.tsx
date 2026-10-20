'use client';

import { useActionState, useState, useEffect } from 'react';
import { createAssignmentAction, type AssignmentActionState } from './actions';

type Room = { id: string; name: string };
type Question = { id: string; type: string; content: string };

export function CreateAssignmentButton({ teacherId }: { teacherId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<AssignmentActionState, FormData>(createAssignmentAction, {});
  const [rooms, setRooms] = useState<Room[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQs, setSelectedQs] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    fetch('/api/teacher/rooms').then((r) => r.json()).then((d) => setRooms(d.rooms ?? [])).catch(() => {});
    fetch('/api/teacher/questions').then((r) => r.json()).then((d) => setQuestions(d.questions ?? [])).catch(() => {});
  }, [open]);

  if (state.success) {
    if (open) {
      setTimeout(() => { setOpen(false); setSelectedQs([]); }, 0);
    }
  }

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

        <label className="block">
          <span className="text-xs text-slate-400">Tiêu đề</span>
          <input name="title" type="text" required className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white" />
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

        {/* Question picker */}
        <div>
          <span className="text-xs text-slate-400">Chọn câu hỏi ({selectedQs.length} đã chọn)</span>
          <div className="mt-1 bg-slate-800 rounded-lg border border-slate-700 max-h-48 overflow-y-auto p-2 space-y-1">
            {questions.length === 0 && <p className="text-xs text-slate-500 p-2">Chưa có câu hỏi. Tạo trong Ngân hàng câu hỏi.</p>}
            {questions.map((q) => (
              <label key={q.id} className="flex items-start gap-2 p-1.5 hover:bg-slate-700 rounded text-sm text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedQs.includes(q.id)}
                  onChange={(e) => {
                    setSelectedQs((prev) =>
                      e.target.checked ? [...prev, q.id] : prev.filter((id) => id !== q.id)
                    );
                  }}
                  className="mt-0.5"
                />
                <span className="line-clamp-1">[{q.type}] {q.content}</span>
              </label>
            ))}
          </div>
        </div>

        <input type="hidden" name="question_ids" value={selectedQs.join(',')} />

        <div className="flex gap-2">
          <button type="submit" disabled={pending || selectedQs.length === 0} className="rounded-lg bg-green-600 hover:bg-green-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 min-h-[44px]">
            {pending ? 'Đang tạo...' : 'Tạo bài giao'}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]">
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
