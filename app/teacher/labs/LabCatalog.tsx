'use client';

import { useState, useEffect } from 'react';
import { FlaskConical, Clock, Send, Play, ExternalLink, X } from 'lucide-react';
import type { ExperimentRow } from '@/services/experiments';
import { assignExperimentAction } from './actions';

const SUBJECT_LABELS: Record<string, string> = {
  vat_ly: 'Vật lý',
  hoa_hoc: 'Hóa học',
  sinh_hoc: 'Sinh học',
  khtn_chung: 'KHTN chung',
};
const DIFF_LABELS: Record<number, string> = { 1: 'Dễ', 2: 'TB', 3: 'Khó' };
const DIFF_COLORS: Record<number, string> = {
  1: 'bg-green-900/50 text-green-400',
  2: 'bg-yellow-900/50 text-yellow-400',
  3: 'bg-red-900/50 text-red-400',
};

type Room = { id: string; name: string };

export function LabCatalog({ experiments }: { experiments: ExperimentRow[] }) {
  const [filter, setFilter] = useState('all');
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState('');
  const [previewExp, setPreviewExp] = useState<ExperimentRow | null>(null);

  useEffect(() => {
    fetch('/api/teacher/rooms')
      .then((r) => r.json())
      .then((d) => setRooms(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const filtered = filter === 'all'
    ? experiments
    : experiments.filter((e) => e.subject === filter);

  async function handleAssign(experimentId: string) {
    if (!selectedRoom) return;
    setAssigning(true);
    setMessage('');
    const result = await assignExperimentAction(experimentId, selectedRoom);
    setAssigning(false);
    if ('error' in result && result.error) {
      setMessage(result.error);
    } else {
      setMessage('Đã giao thí nghiệm!');
      setAssigningId(null);
      setSelectedRoom('');
    }
  }

  return (
    <>
    {previewExp && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="relative w-full max-w-4xl h-[85vh] rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-900">
            <div>
              <h2 className="text-white font-bold">{previewExp.title}</h2>
              <p className="text-xs text-slate-400">{SUBJECT_LABELS[previewExp.subject]} · Lớp {previewExp.grade_level}</p>
            </div>
            <button
              onClick={() => setPreviewExp(null)}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {previewExp.embed_url ? (
            <iframe
              src={previewExp.embed_url}
              className="flex-1 w-full border-0"
              title={previewExp.title}
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Thí nghiệm này đang được phát triển</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )}
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'vat_ly', label: 'Vật lý' },
          { key: 'hoa_hoc', label: 'Hóa học' },
          { key: 'sinh_hoc', label: 'Sinh học' },
          { key: 'khtn_chung', label: 'KHTN chung' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium min-h-[36px] ${
              filter === f.key
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Chưa có thí nghiệm nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((exp) => (
            <div
              key={exp.id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition"
            >
              {exp.thumbnail_url ? (
                <img src={exp.thumbnail_url} alt="" className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 bg-gradient-to-br from-cyan-900/30 to-purple-900/30 flex items-center justify-center">
                  <FlaskConical className="w-10 h-10 text-cyan-500/50" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <h3 className="text-white font-medium text-sm">{exp.title}</h3>
                {exp.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">{exp.description}</p>
                )}
                <div className="flex gap-2 flex-wrap text-[10px]">
                  <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                    {SUBJECT_LABELS[exp.subject]}
                  </span>
                  <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                    Lớp {exp.grade_level}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded ${DIFF_COLORS[exp.difficulty] ?? ''}`}>
                    {DIFF_LABELS[exp.difficulty]}
                  </span>
                  <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Clock size={10} /> {exp.duration_minutes}p
                  </span>
                </div>

                {assigningId === exp.id ? (
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
                        onClick={() => handleAssign(exp.id)}
                        disabled={!selectedRoom || assigning}
                        className="flex-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 text-xs text-white disabled:opacity-50 min-h-[36px]"
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
                    {exp.embed_url && (
                      <button
                        onClick={() => setPreviewExp(exp)}
                        className="flex-1 rounded-lg bg-cyan-700 hover:bg-cyan-600 px-3 py-2 text-xs text-white flex items-center justify-center gap-1.5 min-h-[44px]"
                      >
                        <Play size={12} /> Mở dạy
                      </button>
                    )}
                    <button
                      onClick={() => setAssigningId(exp.id)}
                      className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs text-white flex items-center justify-center gap-1.5 min-h-[44px]"
                    >
                      <Send size={12} /> Giao cho lớp
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
