'use client';

import { useState, useEffect } from 'react';

type Room = { id: string; name: string };

const STEM_PROJECTS = [
  {
    id: 'pin-volta',
    title: 'Lắp ráp pin Volta (Zn-Cu)',
    description: 'Mô phỏng thí nghiệm lắp ráp pin điện hóa Volta, khám phá phản ứng oxi hóa - khử, đo điện áp và dòng điện chuẩn THCS.',
    grade: 9,
    url: '/stem/pin-volta/index.html',
    icon: '🔋',
  },
];

export function StemMakerList({ teacherId }: { teacherId: string }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/teacher/rooms')
      .then((r) => r.json())
      .then((d) => setRooms(d.rooms ?? []))
      .catch(() => {});
  }, []);

  async function handleAssign(project: typeof STEM_PROJECTS[0]) {
    if (!selectedRoom) return;
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/teacher/stem-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: selectedRoom,
          resource_id: project.id,
          resource_title: project.title,
          title: `STEM Maker: ${project.title}`,
        }),
      });
      if (res.ok) {
        setMessage('Đã giao bài tập thành công! Học sinh sẽ nhận thông báo.');
        setAssigning(null);
        setSelectedRoom('');
      } else {
        const data = await res.json();
        setMessage(data.error || 'Có lỗi xảy ra');
      }
    } catch {
      setMessage('Lỗi kết nối');
    }
    setSubmitting(false);
  }

  function handleOpenInClass(project: typeof STEM_PROJECTS[0]) {
    window.open(project.url, '_blank');
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="p-3 bg-emerald-950/50 border border-emerald-700 rounded-lg text-sm text-emerald-300">
          {message}
        </div>
      )}

      {[6, 7, 8, 9].map((grade) => {
        const projects = STEM_PROJECTS.filter((p) => p.grade === grade);
        return (
          <div key={grade}>
            <h2 className="text-sm font-medium text-slate-400 mb-2">Khối {grade}</h2>
            {projects.length === 0 ? (
              <p className="text-xs text-slate-600 bg-slate-900 rounded-lg p-3 border border-slate-800">
                Chưa có dự án STEM Maker cho khối {grade}. Sắp ra mắt!
              </p>
            ) : (
              <div className="space-y-3">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 hover:border-amber-500/40 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl shrink-0">
                        {p.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white">{p.title}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{p.description}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => { setAssigning(p.id); setSelectedRoom(''); setMessage(''); }}
                          className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white min-h-[44px] transition-colors"
                        >
                          Giao bài tập
                        </button>
                        <button
                          onClick={() => handleOpenInClass(p)}
                          className="rounded-lg bg-amber-600 hover:bg-amber-500 px-4 py-2 text-sm font-medium text-white min-h-[44px] transition-colors"
                        >
                          Mở tại lớp
                        </button>
                      </div>
                    </div>

                    {assigning === p.id && (
                      <div className="mt-4 p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
                        <h4 className="text-sm font-bold text-white">Giao bài tập STEM</h4>
                        <p className="text-xs text-slate-400">Chọn lớp để giao. Học sinh sẽ nhận thông báo và thấy nhiệm vụ trong phòng STEM.</p>

                        {rooms.length === 0 ? (
                          <p className="text-xs text-slate-500">Chưa có phòng học. Vào Phòng học để tạo lớp trước.</p>
                        ) : (
                          <div className="space-y-2">
                            {rooms.map((r) => (
                              <label
                                key={r.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                                  selectedRoom === r.id
                                    ? 'bg-blue-900/20 border-blue-500/50'
                                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="room_id"
                                  value={r.id}
                                  checked={selectedRoom === r.id}
                                  onChange={() => setSelectedRoom(r.id)}
                                  className="accent-blue-500"
                                />
                                <span className="text-sm text-white">{r.name}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAssign(p)}
                            disabled={!selectedRoom || submitting}
                            className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 min-h-[44px] transition-colors"
                          >
                            {submitting ? 'Đang giao...' : 'Xác nhận giao'}
                          </button>
                          <button
                            onClick={() => setAssigning(null)}
                            className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
