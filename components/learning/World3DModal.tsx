'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DialogFrame } from '@/components/ui/DialogFrame';
import { Globe, ArrowLeft, Loader2, RotateCcw, ZoomIn, Box, CheckCircle2 } from 'lucide-react';

type Model3D = {
  id: string;
  title: string;
  description: string;
  grade: number;
  embed_url: string | null;
  thumbnail_url: string | null;
};

const GRADE_FILTERS = [
  { key: 'all', label: 'Tất cả', icon: '🌐' },
  { key: '6', label: 'Khối 6', icon: '6️⃣' },
  { key: '7', label: 'Khối 7', icon: '7️⃣' },
  { key: '8', label: 'Khối 8', icon: '8️⃣' },
  { key: '9', label: 'Khối 9', icon: '9️⃣' },
];

const DEMO_MODELS: Model3D[] = [
  {
    id: 'demo_cell_3d',
    title: 'Tế bào động vật',
    description: 'Mô hình 3D tế bào động vật với nhân, ti thể, lưới nội chất và các bào quan.',
    grade: 6,
    embed_url: null,
    thumbnail_url: null,
  },
  {
    id: 'demo_solar',
    title: 'Hệ Mặt Trời',
    description: 'Mô hình hệ Mặt Trời với 8 hành tinh, quỹ đạo và khoảng cách tương đối.',
    grade: 6,
    embed_url: null,
    thumbnail_url: null,
  },
  {
    id: 'demo_water',
    title: 'Phân tử nước (H₂O)',
    description: 'Cấu trúc phân tử nước: liên kết cộng hóa trị, góc liên kết 104.5°, phân cực.',
    grade: 7,
    embed_url: null,
    thumbnail_url: null,
  },
  {
    id: 'demo_heart',
    title: 'Tim người',
    description: 'Mô hình 3D tim người với 4 ngăn, van tim và hệ mạch máu chính.',
    grade: 8,
    embed_url: null,
    thumbnail_url: null,
  },
  {
    id: 'demo_nacl',
    title: 'Tinh thể NaCl',
    description: 'Cấu trúc tinh thể muối ăn: ion Na⁺ và Cl⁻ sắp xếp đều đặn trong không gian.',
    grade: 8,
    embed_url: null,
    thumbnail_url: null,
  },
];

type TaskAssignment = {
  id: string;
  resource_id: string;
  title: string;
  completed?: boolean;
};

interface World3DModalProps {
  onClose: () => void;
}

export function World3DModal({ onClose }: World3DModalProps) {
  const [models, setModels] = useState<Model3D[]>(DEMO_MODELS);
  const [activeModel, setActiveModel] = useState<Model3D | null>(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [completingTask, setCompletingTask] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/models')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setModels(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch('/api/student-assignments')
      .then((r) => r.json())
      .then((data) => {
        const m3dTasks = (data.assignments ?? [])
          .filter((a: Record<string, unknown>) => a.assignment_type === 'model3d')
          .map((a: Record<string, unknown>) => ({ id: a.id, resource_id: a.resource_id, title: a.title }));
        setTasks(m3dTasks);
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

  const filtered = filter === 'all' ? models : models.filter((m) => String(m.grade) === filter);

  if (activeModel) {
    return (
      <DialogFrame onClose={onClose} label="Thế Giới 3D" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
        <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-cyan-800/30 flex flex-col bg-gradient-to-b from-cyan-950/90 to-slate-950/95 text-white">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-cyan-800/40">
            <button
              onClick={() => setActiveModel(null)}
              className="p-2 rounded-lg hover:bg-cyan-900/50 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Quay lại danh sách"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg truncate">{activeModel.title}</h2>
              <p className="text-sm text-cyan-300">Khối {activeModel.grade}</p>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {(() => {
              const task = tasks.find((t) => t.resource_id === activeModel.id);
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
                      {completingTask === task.id ? 'Đang xác nhận...' : 'Hoàn thành nhiệm vụ (+25 XP)'}
                    </button>
                  )}
                </div>
              );
            })()}
            {/* Cross-building suggestions */}
            <div className="mb-4 flex flex-wrap gap-2">
              <a href="/student/library" className="text-xs px-3 py-1.5 rounded-lg bg-indigo-900/40 text-indigo-300 hover:bg-indigo-900/60 transition min-h-[36px] flex items-center gap-1">
                📖 Đọc lý thuyết tại Thư viện
              </a>
              <a href="/student/virtual-lab" className="text-xs px-3 py-1.5 rounded-lg bg-orange-900/40 text-orange-300 hover:bg-orange-900/60 transition min-h-[36px] flex items-center gap-1">
                🔬 Thí nghiệm tại Phòng TN Ảo
              </a>
            </div>
            {activeModel.embed_url ? (
              <iframe
                src={activeModel.embed_url}
                className="w-full h-[60vh] rounded-xl border border-cyan-800/30"
                title={activeModel.title}
                sandbox="allow-scripts allow-same-origin"
                loading="lazy"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-cyan-900/50 border border-cyan-700/50 flex items-center justify-center">
                  <Box className="w-10 h-10 text-cyan-400" />
                </div>
                <div>
                  <p className="text-cyan-200 font-medium">{activeModel.description}</p>
                  <div className="flex items-center justify-center gap-4 mt-4 text-xs text-cyan-400">
                    <span className="flex items-center gap-1"><RotateCcw className="w-4 h-4" /> Xoay</span>
                    <span className="flex items-center gap-1"><ZoomIn className="w-4 h-4" /> Phóng to</span>
                  </div>
                  <p className="text-sm text-cyan-400 mt-3">
                    Mô hình đang được phát triển. Giáo viên có thể gán mô hình từ nguồn bên ngoài.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogFrame>
    );
  }

  return (
    <DialogFrame onClose={onClose} label="Thế Giới 3D" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-cyan-800/30 flex flex-col bg-gradient-to-b from-cyan-950/90 to-slate-950/95 text-white">
        {/* Header */}
        <div className="px-4 py-4 border-b border-cyan-800/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-900/60 border border-cyan-700/50 flex items-center justify-center">
              🌐
            </div>
            <div>
              <h1 className="font-bold text-lg">Thế Giới 3D</h1>
              <p className="text-xs text-cyan-300">Xoay, phóng to, khám phá mô hình khoa học</p>
            </div>
          </div>
          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            {GRADE_FILTERS.map((c) => (
              <button
                key={c.key}
                onClick={() => setFilter(c.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition min-h-[36px] flex items-center gap-1.5 ${
                  filter === c.key ? 'bg-cyan-600 text-white' : 'bg-cyan-900/40 text-cyan-300 hover:bg-cyan-900/60'
                }`}
              >
                <span>{c.icon}</span> {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Model grid */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-cyan-400 py-8">Chưa có mô hình nào cho danh mục này.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filtered.map((model) => {
                const task = tasks.find((t) => t.resource_id === model.id);
                return (
                <button
                  key={model.id}
                  onClick={() => setActiveModel(model)}
                  className={`text-left p-3 rounded-xl border hover:bg-cyan-900/50 hover:border-cyan-600/50 transition group min-h-[44px] ${
                    task ? 'bg-blue-900/20 border-blue-500/30' : 'bg-cyan-900/30 border-cyan-800/30'
                  }`}
                >
                  <div className="w-full aspect-square rounded-lg bg-cyan-900/40 flex items-center justify-center mb-2">
                    {model.thumbnail_url ? (
                      <img src={model.thumbnail_url} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Globe className="w-8 h-8 text-cyan-500 group-hover:text-cyan-300 transition" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-sm text-white group-hover:text-cyan-200 transition truncate">
                      {model.title}
                    </h3>
                    {task && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${task.completed ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'}`}>
                        {task.completed ? '✓' : 'GV'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-cyan-400 mt-0.5">Khối {model.grade}</p>
                </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DialogFrame>
  );
}
