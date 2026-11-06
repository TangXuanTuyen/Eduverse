'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DialogFrame } from '@/components/ui/DialogFrame';
import { experimentThumb } from '@/lib/experiments/thumbs';
import { Atom, Play, Clock, ArrowLeft, Loader2, ExternalLink, CheckCircle2 } from 'lucide-react';

type Experiment = {
  id: string;
  title: string;
  description: string;
  subject: string;
  grade_level: number;
  thumbnail_url: string | null;
  embed_url: string | null;
  component_key: string | null;
  duration_minutes: number;
  difficulty: number;
};

const GRADE_LABELS: Record<number, string> = {
  6: 'Khối 6',
  7: 'Khối 7',
  8: 'Khối 8',
  9: 'Khối 9',
};

// Cơ sở dữ liệu lưu môn học dạng mã (vat_ly...), bản mẫu dùng chữ có dấu
const SUBJECT_LABELS: Record<string, string> = {
  vat_ly: 'Vật lý',
  hoa_hoc: 'Hóa học',
  sinh_hoc: 'Sinh học',
};
const subjectLabel = (s: string) => SUBJECT_LABELS[s] ?? s;
const SUBJECT_ICONS: Record<string, string> = { 'Vật lý': '⚛️', 'Hóa học': '🧪', 'Sinh học': '🔬' };

const DEMO_EXPERIMENTS: Experiment[] = [
  {
    id: 'vat_dan_dien_cach_dien',
    title: 'Vật dẫn điện, vật cách điện & Điện nghiệm',
    description: 'Bài 21 · Chương V: Điện — Thử các vật liệu trong mạch điện để phân biệt vật dẫn điện và vật cách điện. Quan sát sự dịch chuyển điện tích giữa hai điện nghiệm.',
    subject: 'Vật lý',
    grade_level: 8,
    thumbnail_url: null,
    embed_url: '/experiments/vat-dan-dien-cach-dien/index.html',
    component_key: 'vat_dan_dien_cach_dien',
    duration_minutes: 15,
    difficulty: 1,
  },
  {
    id: 'simple_circuit',
    title: 'Bài 22: Mạch điện đơn giản',
    description: 'Bài 22 · Chương V: Điện — Kéo thả pin, bóng đèn, công tắc, dây dẫn để lắp mạch điện nối tiếp, đo ampe kế và vôn kế, làm hoạt động nhận biết kí hiệu.',
    subject: 'Vật lý',
    grade_level: 8,
    thumbnail_url: null,
    embed_url: '/experiments/mach-dien-don-gian/index.html',
    component_key: 'simple_circuit',
    duration_minutes: 15,
    difficulty: 1,
  },
  {
    id: 'lo_xo_dan_hoi',
    title: 'Bài 42: Biến dạng của lò xo',
    description: 'Bài 42 · Khối 6: Biến dạng của lò xo — Đối chứng hai lò xo, treo quả nặng, đo độ dãn, ghi bảng số liệu, vẽ đồ thị và trả lời câu hỏi.',
    subject: 'Vật lý',
    grade_level: 6,
    thumbnail_url: null,
    embed_url: '/experiments/lo-xo-dan-hoi/index.html',
    component_key: 'lo_xo_dan_hoi',
    duration_minutes: 20,
    difficulty: 2,
  },
  {
    id: 'demo_acid_base',
    title: 'Phản ứng axit – bazơ',
    description: 'Nhỏ dung dịch axit và bazơ lên quỳ tím, quan sát sự đổi màu và ghi nhận kết quả.',
    subject: 'Hóa học',
    grade_level: 8,
    thumbnail_url: null,
    embed_url: null,
    component_key: null,
    duration_minutes: 10,
    difficulty: 1,
  },
  {
    id: 'demo_cell',
    title: 'Quan sát tế bào thực vật',
    description: 'Sử dụng kính hiển vi ảo để quan sát cấu trúc tế bào hành tây ở các độ phóng đại khác nhau.',
    subject: 'Sinh học',
    grade_level: 6,
    thumbnail_url: null,
    embed_url: null,
    component_key: null,
    duration_minutes: 12,
    difficulty: 1,
  },
  {
    id: 'demo_force',
    title: 'Lực và chuyển động',
    description: 'Đẩy vật trên mặt phẳng nghiêng, thay đổi góc nghiêng và khối lượng để quan sát gia tốc.',
    subject: 'Vật lý',
    grade_level: 8,
    thumbnail_url: null,
    embed_url: null,
    component_key: null,
    duration_minutes: 15,
    difficulty: 2,
  },
];

type TaskAssignment = {
  id: string;
  resource_id: string;
  title: string;
  completed?: boolean;
};

interface VirtualLabModalProps {
  onClose: () => void;
}

export function VirtualLabModal({ onClose }: VirtualLabModalProps) {
  const [experiments, setExperiments] = useState<Experiment[]>(DEMO_EXPERIMENTS);
  const [activeExp, setActiveExp] = useState<Experiment | null>(null);
  const [filter, setFilter] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [completingTask, setCompletingTask] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/experiments')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const dbIds = new Set(data.map((e: Experiment) => e.component_key));
          const remaining = DEMO_EXPERIMENTS.filter((d) => !dbIds.has(d.component_key));
          setExperiments([...data, ...remaining]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch('/api/student-assignments')
      .then((r) => r.json())
      .then((data) => {
        const expTasks = (data.assignments ?? [])
          .filter((a: Record<string, unknown>) => a.assignment_type === 'experiment')
          .map((a: Record<string, unknown>) => ({ id: a.id, resource_id: a.resource_id, title: a.title }));
        setTasks(expTasks);
      })
      .catch(() => {});
  }, []);

  const completeTask = useCallback(async (assignmentId: string) => {
    setCompletingTask(assignmentId);
    try {
      const res = await fetch('/api/task-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment_id: assignmentId }),
      });
      if (res.ok) {
        setTasks((prev) => prev.map((t) => t.id === assignmentId ? { ...t, completed: true } : t));
      }
    } catch { /* ignore */ }
    setCompletingTask(null);
  }, []);

  const grades = [6, 7, 8, 9] as const;
  const filtered = filter === 'all' ? experiments : experiments.filter((e) => e.grade_level === filter);
  // Chia theo khối: mỗi khối một nhóm có tiêu đề, bên trong là thẻ thí nghiệm
  const sections = (filter === 'all' ? grades : [filter])
    .map((g) => ({ g, items: filtered.filter((e) => e.grade_level === g) }))
    .filter((x) => x.items.length > 0);

  if (activeExp) {
    return (
      <DialogFrame onClose={onClose} label="Phòng Thí Nghiệm Ảo" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
        <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-orange-800/30 flex flex-col bg-gradient-to-b from-orange-950/90 to-slate-950/95 text-white">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-orange-800/40">
            <button
              onClick={() => setActiveExp(null)}
              className="p-2 rounded-lg hover:bg-orange-900/50 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Quay lại danh sách"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg truncate">{activeExp.title}</h2>
              <p className="text-sm text-orange-300">Khối {activeExp.grade_level} · {subjectLabel(activeExp.subject)}</p>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <p className="text-orange-200 mb-4">{activeExp.description}</p>
            {(() => {
              const task = tasks.find((t) => t.resource_id === activeExp.id);
              return task && (
                <div className="mb-4 p-3 rounded-lg bg-blue-900/30 border border-blue-500/40">
                  <p className="text-sm text-blue-300 font-medium">
                    📋 Nhiệm vụ từ GV: {task.title}
                  </p>
                  {task.completed ? (
                    <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn thành
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => completeTask(task.id)}
                      disabled={completingTask === task.id}
                      className="mt-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold min-h-[36px] disabled:opacity-50"
                    >
                      {completingTask === task.id ? 'Đang xác nhận...' : 'Hoàn thành nhiệm vụ (+30 XP)'}
                    </button>
                  )}
                </div>
              );
            })()}
            <div className="mb-4 flex flex-wrap gap-2">
              <a href="/student/world-3d" className="text-xs px-3 py-1.5 rounded-lg bg-cyan-900/40 text-cyan-300 hover:bg-cyan-900/60 transition min-h-[36px] flex items-center gap-1">
                🌐 Xem mô hình 3D liên quan tại Thế Giới 3D
              </a>
              <a href="/student/library" className="text-xs px-3 py-1.5 rounded-lg bg-indigo-900/40 text-indigo-300 hover:bg-indigo-900/60 transition min-h-[36px] flex items-center gap-1">
                📖 Đọc lý thuyết tại Thư viện
              </a>
            </div>
            {activeExp.embed_url ? (
              <a
                href={activeExp.embed_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm transition min-h-[44px]"
              >
                <Play className="w-5 h-5" /> Bắt đầu thí nghiệm <ExternalLink className="w-4 h-4 opacity-60" />
              </a>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-orange-900/50 border border-orange-700/50 flex items-center justify-center">
                  <Atom className="w-10 h-10 text-orange-400" />
                </div>
                <p className="text-sm text-orange-400">
                  Thí nghiệm này đang được phát triển. Giáo viên có thể gán thí nghiệm từ nguồn bên ngoài.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogFrame>
    );
  }

  return (
    <DialogFrame onClose={onClose} label="Phòng Thí Nghiệm Ảo" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-orange-800/30 flex flex-col bg-gradient-to-b from-orange-950/90 to-slate-950/95 text-white">
        {/* Header */}
        <div className="px-4 py-4 border-b border-orange-800/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-900/60 border border-orange-700/50 flex items-center justify-center">
              🔬
            </div>
            <div>
              <h1 className="font-bold text-lg">Phòng Thí Nghiệm Ảo</h1>
              <p className="text-xs text-orange-300">Mô phỏng an toàn — thử bao nhiêu lần cũng được</p>
            </div>
          </div>
          {/* Subject filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition min-h-[36px] ${
                filter === 'all' ? 'bg-orange-600 text-white' : 'bg-orange-900/40 text-orange-300 hover:bg-orange-900/60'
              }`}
            >
              Tất cả
            </button>
            {grades.map((g) => (
              <button
                key={g}
                onClick={() => setFilter(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition min-h-[36px] ${
                  filter === g ? 'bg-orange-600 text-white' : 'bg-orange-900/40 text-orange-300 hover:bg-orange-900/60'
                }`}
              >
                {GRADE_LABELS[g]}
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách thí nghiệm: thẻ có ảnh xem nhanh và tên, lọc theo khối */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-orange-400 py-8">Chưa có thí nghiệm nào cho khối này.</p>
          ) : (
            <div className="space-y-5">
              {sections.map(({ g, items }) => (
                <section key={g} aria-labelledby={`lab-grade-${g}`}>
                  <h2 id={`lab-grade-${g}`} className="text-sm font-bold text-orange-200 mb-2">{GRADE_LABELS[g] ?? `Khối ${g}`}</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((exp) => {
                const task = tasks.find((t) => t.resource_id === exp.id);
                const thumb = experimentThumb(exp);
                const subject = subjectLabel(exp.subject);
                return (
                  <li key={exp.id}>
                    <button
                      type="button"
                      onClick={() => setActiveExp(exp)}
                      className={`group w-full h-full text-left rounded-xl overflow-hidden border hover:border-orange-500/70 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 transition motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-orange-400 cursor-pointer flex flex-col ${
                        task ? 'bg-blue-900/20 border-blue-500/30' : 'bg-orange-900/30 border-orange-800/40'
                      }`}
                    >
                      <div className="relative aspect-video bg-gradient-to-br from-orange-900/60 to-slate-900 overflow-hidden">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-5xl">
                            {SUBJECT_ICONS[subject] ?? '🧪'}
                          </span>
                        )}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-500/90 text-orange-950">
                          Khối {exp.grade_level}
                        </span>
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-950/80 text-slate-200 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {exp.duration_minutes} phút
                        </span>
                        <span className="absolute inset-x-0 bottom-0 px-3 py-2 text-xs font-bold text-white bg-gradient-to-t from-slate-950/90 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition motion-reduce:transition-none flex items-center gap-1.5">
                          <Play className="w-3.5 h-3.5" /> Mở thí nghiệm
                        </span>
                      </div>
                      <div className="p-3 flex-1 flex flex-col gap-1">
                        <h3 className="text-sm font-bold text-white leading-snug">{exp.title}</h3>
                        <p className="text-xs text-orange-300/80 line-clamp-2">{exp.description}</p>
                        <div className="mt-auto pt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-orange-400">
                          <span>{subject}</span>
                          <span aria-label={`Độ khó ${exp.difficulty} trên 3`}>{'⭐'.repeat(exp.difficulty)}</span>
                          {task && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${task.completed ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'}`}>
                              {task.completed ? '✓ Xong' : 'Nhiệm vụ GV'}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </DialogFrame>
  );
}
