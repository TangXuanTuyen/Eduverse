/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FitFrame } from '@/components/ui/FitFrame';
import { Portal } from '@/components/ui/Portal';
import { sound } from '@/lib/audio';
import { X, ArrowLeft, Clock } from 'lucide-react';
import { DialogFrame } from '@/components/ui/DialogFrame';
import { ExperimentViewer } from './ExperimentViewer';

type StemProject = {
  id: string;
  title: string;
  description: string;
  grade: number;
  url: string;
  icon: string;
  thumb: string;
};

type GalleryKind = 'maker' | 'experiment';

type GalleryItem = {
  key: string;
  kind: GalleryKind;
  title: string;
  description: string;
  thumb: string | null;
  icon: string;
  meta?: string;
  task?: { completed?: boolean };
  open: () => void;
};

const GALLERY_KINDS: Record<GalleryKind, { label: string; badge: string; ring: string; gradient: string }> = {
  maker: { label: 'STEM Maker', badge: 'bg-amber-500/90 text-amber-950', ring: 'hover:border-amber-400/70', gradient: 'from-amber-900/60 to-slate-900' },
  experiment: { label: 'Thí nghiệm ảo', badge: 'bg-cyan-400/90 text-cyan-950', ring: 'hover:border-cyan-400/70', gradient: 'from-cyan-900/60 to-slate-900' },
};

const STEM_PROJECTS: StemProject[] = [
  {
    id: 'pin-volta',
    title: 'Lắp ráp pin Volta (Zn-Cu)',
    description: 'Mô phỏng thí nghiệm lắp ráp pin điện hóa Volta, khám phá phản ứng oxi hóa - khử, đo điện áp và dòng điện.',
    grade: 9,
    url: '/stem/pin-volta/index.html',
    icon: '🔋',
    thumb: '/stem/thumbs/pin-volta.jpg',
  },
  {
    id: 'xe-dap-phat-dien',
    title: 'Xe đạp phát điện (Dynamo)',
    description: 'Đạp xe để chuyển cơ năng thành điện năng và quang năng. Điều khiển bằng bàn phím, chuột hoặc camera nhận diện chuyển động chạy tại chỗ.',
    grade: 9,
    url: '/stem/xe-dap-phat-dien/index.html',
    icon: '🚲',
    thumb: '/stem/thumbs/xe-dap-phat-dien.jpg',
  },
  {
    id: 'thuy-dien',
    title: 'Thiết kế nhà máy thủy điện mini',
    description: 'Thiết kế, thử nghiệm và cải tiến mô hình thủy điện mini: biến đổi năng lượng để giải bài toán cấp điện thực tế.',
    grade: 6,
    url: '/stem/thuy-dien/index.html',
    icon: '💧',
    thumb: '/stem/thumbs/thuy-dien.jpg',
  },
];

type DynamicExperiment = {
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

interface StemLabModalProps {
  onClose: () => void;
}

export const StemLabModal: React.FC<StemLabModalProps> = ({
  onClose,
}) => {
  const [dynamicExperiments, setDynamicExperiments] = useState<DynamicExperiment[]>([]);
  const [viewingExperimentId, setViewingExperimentId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<{ id: string; resource_id: string; title: string; completed?: boolean }[]>([]);
  const [galleryFilter, setGalleryFilter] = useState<'all' | GalleryKind>('all');
  const [viewingStemProject, setViewingStemProject] = useState<string | null>(null);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [openedProjects, setOpenedProjects] = useState<string[]>([]);

  const openProject = (id: string) => {
    sound.playClick();
    setViewingStemProject(id);
    setOpenedProjects((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  useEffect(() => {
    fetch('/api/experiments')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDynamicExperiments(data.filter((e: DynamicExperiment) => !e.component_key));
        }
      })
      .catch(() => {});
    fetch('/api/student-assignments')
      .then((r) => r.json())
      .then((data) => {
        const stemTasks = (data.assignments ?? [])
          .filter((a: Record<string, unknown>) => a.assignment_type === 'stem')
          .map((a: Record<string, unknown>) => ({ id: a.id, resource_id: a.resource_id, title: a.title, completed: a.completed === true }));
        setTasks(stemTasks);
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

  const galleryItems: GalleryItem[] = [
    ...STEM_PROJECTS.map((p): GalleryItem => ({
      key: `maker-${p.id}`,
      kind: 'maker',
      title: p.title,
      description: p.description,
      thumb: p.thumb,
      icon: p.icon,
      task: tasks.find((t) => t.resource_id === p.id),
      open: () => openProject(p.id),
    })),
    ...dynamicExperiments.map((e): GalleryItem => ({
      key: `exp-${e.id}`,
      kind: 'experiment',
      title: e.title,
      description: e.description,
      thumb: e.thumbnail_url,
      icon: '🔬',
      meta: `${e.duration_minutes} phút`,
      open: () => { sound.playClick(); setViewingExperimentId(e.id); },
    })),
  ];
  const kindCounts: Record<GalleryKind, number> = { maker: 0, experiment: 0 };
  galleryItems.forEach((g) => { kindCounts[g.kind]++; });
  const visibleItems = galleryFilter === 'all' ? galleryItems : galleryItems.filter((g) => g.kind === galleryFilter);

  return (
    <DialogFrame onClose={onClose} labelledBy="dialog-title-stem" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-5xl bg-slate-900 border-2 border-emerald-500/50 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/80 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 text-emerald-400 border border-emerald-500/50 flex items-center justify-center text-xl">
              🧪
            </div>
            <div>
              <h2 id="dialog-title-stem" className="text-base font-bold text-white flex items-center gap-2">
                Phòng Thí Nghiệm STEM (STEM Lab)
              </h2>
              <p className="text-xs text-emerald-300">
                Mô phỏng thí nghiệm thực hành: Hóa học - Vật lý - Sinh học THCS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Quay lại thành phố"
              className="min-h-11 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Quay lại thành phố</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Đóng [Esc]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
        {/* THƯ VIỆN THỰC HÀNH: STEM Maker và thí nghiệm ảo, không chia theo khối */}
        <section aria-labelledby="stem-gallery-title" className="px-6 py-5 bg-slate-950/40 border-b border-slate-800">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <h3 id="stem-gallery-title" className="text-sm font-bold text-white">Thư viện thực hành</h3>
              <p className="text-xs text-slate-400 mt-0.5">Bấm vào một thẻ để xem trực tiếp và thực hành ngay.</p>
            </div>
            <div role="group" aria-label="Lọc theo loại hoạt động" className="flex flex-wrap gap-1.5">
              {([['all', 'Tất cả', galleryItems.length], ['maker', 'STEM Maker', kindCounts.maker], ['experiment', 'Thí nghiệm ảo', kindCounts.experiment]] as const)
                .filter(([id, , count]) => id === 'all' || count > 0)
                .map(([id, label, count]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={galleryFilter === id}
                    onClick={() => { sound.playClick(); setGalleryFilter(id); }}
                    className={`min-h-11 px-3 rounded-xl text-xs font-bold border transition ${
                      galleryFilter === id
                        ? 'bg-emerald-600/30 border-emerald-400/60 text-emerald-100'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {label} <span className="opacity-70">({count})</span>
                  </button>
                ))}
            </div>
          </div>

          {visibleItems.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">Chưa có hoạt động nào trong mục này.</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibleItems.map((g) => {
                const kind = GALLERY_KINDS[g.kind];
                return (
                  <li key={g.key}>
                    <button
                      type="button"
                      onClick={g.open}
                      className={`group w-full h-full text-left rounded-xl overflow-hidden border border-slate-700 bg-slate-800/70 ${kind.ring} hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 transition motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-emerald-400 cursor-pointer flex flex-col`}
                    >
                      <div className={`relative aspect-video bg-gradient-to-br ${kind.gradient} overflow-hidden`}>
                        {g.thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={g.thumb} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-5xl">{g.icon}</span>
                        )}
                        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold ${kind.badge}`}>{kind.label}</span>
                        {g.meta && (
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-950/80 text-slate-200 flex items-center gap-1">
                            <Clock size={10} /> {g.meta}
                          </span>
                        )}
                        <span className="absolute inset-x-0 bottom-0 px-3 py-2 text-xs font-bold text-white bg-gradient-to-t from-slate-950/90 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition motion-reduce:transition-none">
                          Mở và thực hành →
                        </span>
                      </div>
                      <div className="p-3 flex-1 flex flex-col gap-1">
                        <p className="text-sm font-bold text-white leading-snug">{g.title}</p>
                        <p className="text-xs text-slate-400 line-clamp-2">{g.description}</p>
                        {g.task && (
                          <span className={`self-start mt-1 text-[10px] px-2 py-0.5 rounded font-bold ${g.task.completed ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'}`}>
                            {g.task.completed ? '✓ Hoàn thành' : '📋 Nhiệm vụ GV'}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* STEM Maker fullscreen viewer */}
        <Portal>{viewingStemProject && (() => {
          const project = STEM_PROJECTS.find((p) => p.id === viewingStemProject);
          if (!project) return null;
          const task = tasks.find((t) => t.resource_id === project.id);
          return (
            <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
              <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
                <h2 className="text-white font-bold text-sm flex items-center gap-2">
                  <span>{project.icon}</span> {project.title}
                </h2>
                <div className="flex items-center gap-2">
                  {task && (
                    task.completed ? (
                      <span className="text-[11px] px-2 py-1 rounded font-bold bg-green-900 text-green-300">✓ Đã hoàn thành nhiệm vụ</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => completeTask(task.id)}
                        disabled={completingTask === task.id}
                        className="min-h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition disabled:opacity-60"
                      >
                        {completingTask === task.id ? 'Đang xác nhận...' : '✅ Xác nhận hoàn thành nhiệm vụ (+35 XP)'}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setViewingStemProject(null)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
                </div>
              </div>
              <FitFrame
                src={project.url}
                allow="webgl; webgl2; camera"
                title={project.title}
              />
            </div>
          );
        })()}</Portal>

        <Portal>
        {/* Experiment Viewer overlay */}
        {viewingExperimentId && (
          <ExperimentViewer
            experimentId={viewingExperimentId}
            onClose={() => setViewingExperimentId(null)}
          />
        )}

        </Portal>

        {/* TIẾN ĐỘ NHIỆM VỤ STEM DO GIÁO VIÊN GIAO */}
        <section aria-labelledby="stem-progress-title" className="px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h3 id="stem-progress-title" className="text-sm font-bold text-white">Nhiệm vụ STEM của em</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {tasks.length === 0
                  ? 'Giáo viên chưa giao nhiệm vụ STEM nào. Em vẫn có thể thực hành tự do ở thư viện phía trên.'
                  : 'Mở bài thực hành, làm xong rồi xác nhận hoàn thành để nhận XP.'}
              </p>
            </div>
            {tasks.length > 0 && (
              <div className="text-xs font-bold text-teal-200">
                {tasks.filter((t) => t.completed).length}/{tasks.length} đã hoàn thành
              </div>
            )}
          </div>

          {tasks.length > 0 && (
            <>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={tasks.length}
                aria-valuenow={tasks.filter((t) => t.completed).length}
                aria-label="Tiến độ nhiệm vụ STEM"
                className="h-2 rounded-full bg-slate-800 overflow-hidden mb-4"
              >
                <div
                  className="h-full bg-teal-400 transition-all motion-reduce:transition-none"
                  style={{ width: `${Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100)}%` }}
                />
              </div>

              <ul className="space-y-2">
                {tasks.map((t) => {
                  const project = STEM_PROJECTS.find((p) => p.id === t.resource_id);
                  const opened = openedProjects.includes(t.resource_id);
                  return (
                    <li key={t.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/60 p-3">
                      <span aria-hidden="true" className="text-2xl">{project?.icon ?? '🧪'}</span>
                      <div className="flex-1 min-w-[10rem]">
                        <p className="text-sm font-bold text-white">{t.title}</p>
                        <p className="text-xs text-slate-400">{project ? project.title : 'Bài thực hành STEM'}</p>
                      </div>
                      <span className={`text-[11px] px-2 py-1 rounded font-bold ${t.completed ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'}`}>
                        {t.completed ? '✓ Hoàn thành' : '📋 Chưa hoàn thành'}
                      </span>
                      {project && (
                        <button
                          type="button"
                          onClick={() => openProject(project.id)}
                          className="min-h-11 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white transition"
                        >
                          {t.completed ? 'Làm lại' : 'Mở thực hành'}
                        </button>
                      )}
                      {!t.completed && (
                        <button
                          type="button"
                          onClick={() => completeTask(t.id)}
                          disabled={!opened || completingTask === t.id}
                          title={opened ? undefined : 'Em hãy mở bài thực hành trước'}
                          className="min-h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {completingTask === t.id ? 'Đang xác nhận...' : '✅ Xác nhận hoàn thành (+35 XP)'}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
        </div>
      </div>
    </DialogFrame>
  );
};
