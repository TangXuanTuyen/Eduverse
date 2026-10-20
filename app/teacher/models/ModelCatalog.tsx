'use client';

import { useState, useEffect } from 'react';
import { Box, Send } from 'lucide-react';
import type { Model3DRow } from '@/services/models-3d';
import { assignModelAction } from './actions';

const SUBJECT_LABELS: Record<string, string> = {
  vat_ly: 'Vật lý', hoa_hoc: 'Hóa học', sinh_hoc: 'Sinh học', khtn_chung: 'KHTN chung',
};
const CATEGORY_LABELS: Record<string, string> = {
  te_bao: 'Tế bào', phan_tu: 'Phân tử', co_quan: 'Cơ quan',
  thiet_bi: 'Thiết bị', sinh_vat: 'Sinh vật', khac: 'Khác',
};

type Room = { id: string; name: string };

export function ModelCatalog({ models }: { models: Model3DRow[] }) {
  const [filter, setFilter] = useState('all');
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/teacher/rooms')
      .then((r) => r.json())
      .then((d) => setRooms(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const filtered = filter === 'all'
    ? models
    : models.filter((m) => m.subject === filter);

  async function handleAssign(modelId: string) {
    if (!selectedRoom) return;
    setAssigning(true);
    setMessage('');
    const result = await assignModelAction(modelId, selectedRoom);
    setAssigning(false);
    if ('error' in result && result.error) {
      setMessage(result.error);
    } else {
      setMessage('Đã giao!');
      setAssigningId(null);
      setSelectedRoom('');
    }
  }

  const previewModel = previewId ? models.find((m) => m.id === previewId) : null;

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'sinh_hoc', label: 'Sinh học' },
          { key: 'hoa_hoc', label: 'Hóa học' },
          { key: 'vat_ly', label: 'Vật lý' },
          { key: 'khtn_chung', label: 'KHTN chung' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium min-h-[36px] ${
              filter === f.key ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 3D Preview overlay */}
      {previewModel && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
            <h2 className="text-white font-bold text-sm">{previewModel.title}</h2>
            <button
              onClick={() => setPreviewId(null)}
              className="min-h-[44px] px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-white"
            >
              Đóng
            </button>
          </div>
          <div className="flex-1">
            <iframe
              src={previewModel.embed_url}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-popups"
              title={previewModel.title}
            />
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Box className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Chưa có mô hình 3D nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition"
            >
              <button
                onClick={() => setPreviewId(m.id)}
                className="w-full text-left"
              >
                {m.thumbnail_url ? (
                  <img src={m.thumbnail_url} alt="" className="w-full h-36 object-cover" />
                ) : (
                  <div className="w-full h-36 bg-gradient-to-br from-purple-900/30 to-indigo-900/30 flex items-center justify-center">
                    <Box className="w-12 h-12 text-purple-500/50" />
                  </div>
                )}
              </button>
              <div className="p-4 space-y-2">
                <h3 className="text-white font-medium text-sm">{m.title}</h3>
                {m.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">{m.description}</p>
                )}
                <div className="flex gap-2 flex-wrap text-[10px]">
                  <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                    {SUBJECT_LABELS[m.subject]}
                  </span>
                  <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                    Lớp {m.grade_level}
                  </span>
                  <span className="bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded">
                    {CATEGORY_LABELS[m.category]}
                  </span>
                </div>

                {assigningId === m.id ? (
                  <div className="space-y-2 pt-1">
                    <select
                      value={selectedRoom}
                      onChange={(e) => setSelectedRoom(e.target.value)}
                      className="w-full rounded-lg bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs text-white min-h-[36px]"
                    >
                      <option value="">Chọn lớp...</option>
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAssign(m.id)}
                        disabled={!selectedRoom || assigning}
                        className="flex-1 rounded-lg bg-purple-600 hover:bg-purple-500 px-3 py-1.5 text-xs text-white disabled:opacity-50 min-h-[36px]"
                      >
                        {assigning ? '...' : 'Giao'}
                      </button>
                      <button
                        onClick={() => { setAssigningId(null); setMessage(''); }}
                        className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-400 min-h-[36px]"
                      >
                        Hủy
                      </button>
                    </div>
                    {message && <p className="text-xs text-green-400">{message}</p>}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewId(m.id)}
                      className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs text-white flex items-center justify-center gap-1.5 min-h-[44px]"
                    >
                      <Box size={12} /> Xem 3D
                    </button>
                    <button
                      onClick={() => setAssigningId(m.id)}
                      className="rounded-lg bg-purple-600/20 hover:bg-purple-600/30 px-3 py-2 text-xs text-purple-300 flex items-center justify-center gap-1.5 min-h-[44px]"
                    >
                      <Send size={12} /> Giao
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
