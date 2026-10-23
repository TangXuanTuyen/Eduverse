/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { sound } from '@/lib/audio';
import { FlaskConical, Zap, Eye, CheckCircle2, X, Sparkles, Award, ArrowLeft, Clock, Box, Wrench } from 'lucide-react';
import { RoomInteriorScene } from './RoomInteriorScene';
import { DialogFrame } from '@/components/ui/DialogFrame';
import { ExperimentViewer } from './ExperimentViewer';

type StemProject = {
  id: string;
  title: string;
  description: string;
  grade: number;
  url: string;
  icon: string;
};

const STEM_PROJECTS: StemProject[] = [
  {
    id: 'pin-volta',
    title: 'Lắp ráp pin Volta (Zn-Cu)',
    description: 'Mô phỏng thí nghiệm lắp ráp pin điện hóa Volta, khám phá phản ứng oxi hóa - khử, đo điện áp và dòng điện.',
    grade: 9,
    url: '/stem/pin-volta/index.html',
    icon: '🔋',
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
  onCompleteExperiment: (expId: string, xp: number, points: number) => void;
}

export const StemLabModal: React.FC<StemLabModalProps> = ({
  onClose,
  onCompleteExperiment,
}) => {
  const [activeTab, setActiveTab] = useState<'litmus' | 'circuit' | 'microscope'>('litmus');
  const [dynamicExperiments, setDynamicExperiments] = useState<DynamicExperiment[]>([]);
  const [viewingExperimentId, setViewingExperimentId] = useState<string | null>(null);
  const [models3d, setModels3d] = useState<{ id: string; title: string; embed_url: string; thumbnail_url: string | null }[]>([]);
  const [viewing3dModelId, setViewing3dModelId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<{ id: string; resource_id: string; title: string; completed?: boolean }[]>([]);
  const [stemGrade, setStemGrade] = useState(9);
  const [viewingStemProject, setViewingStemProject] = useState<string | null>(null);
  const [completingTask, setCompletingTask] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/experiments')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDynamicExperiments(data.filter((e: DynamicExperiment) => !e.component_key));
        }
      })
      .catch(() => {});
    fetch('/api/models')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setModels3d(data); })
      .catch(() => {});
    fetch('/api/student-assignments')
      .then((r) => r.json())
      .then((data) => {
        const stemTasks = (data.assignments ?? [])
          .filter((a: Record<string, unknown>) => a.assignment_type === 'stem')
          .map((a: Record<string, unknown>) => ({ id: a.id, resource_id: a.resource_id, title: a.title }));
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

  // LITMUS SIMULATION STATE
  const [selectedSolution, setSelectedSolution] = useState<string | null>(null);
  const [litmusColor, setLitmusColor] = useState<string>('#9333EA'); // default purple
  const [litmusStatusText, setLitmusStatusText] = useState('Giấy quỳ tím nguyên bản (chưa nhỏ hóa chất)');
  const [isLitmusDone, setIsLitmusDone] = useState(false);

  // CIRCUIT SIMULATION STATE
  const [isSwitchClosed, setIsSwitchClosed] = useState(false);
  const [isCircuitDone, setIsCircuitDone] = useState(false);

  // MICROSCOPE SIMULATION STATE
  const [focusLevel, setFocusLevel] = useState(20);
  const [isMicroscopeDone, setIsMicroscopeDone] = useState(false);

  const SOLUTIONS = [
    {
      id: 'vinegar',
      name: 'Giấm ăn (Axit)',
      type: 'Axit',
      pH: 2.8,
      resultColor: '#EF4444',
      desc: 'Nồng độ ion H⁺ cao làm giấy quỳ tím hóa Đỏ!'
    },
    {
      id: 'lime_water',
      name: 'Nước vôi trong (Bazơ)',
      type: 'Bazơ',
      pH: 12.4, // nước vôi trong bão hòa ≈ 12,4 (bản gốc ghi 11,5). Cần giáo viên kiểm tra.
      resultColor: '#2563EB',
      desc: 'Chứa ion OH⁻ làm giấy quỳ tím hóa Xanh thẫm!'
    },
    {
      id: 'pure_water',
      name: 'Nước cất tinh khiết',
      type: 'Trung tính',
      pH: 7.0,
      resultColor: '#9333EA',
      desc: 'Môi trường trung tính, giấy quỳ giữ nguyên màu Tím.'
    },
    {
      id: 'lemon_juice',
      name: 'Nước cốt chanh',
      type: 'Axit',
      pH: 2.2,
      resultColor: '#DC2626',
      // Đã sửa: axit citric là axit yếu, bản gốc ghi sai "Axit mạnh". Cần giáo viên kiểm tra.
      desc: 'Axit citric (axit yếu) làm quỳ tím chuyển sang màu Đỏ.'
    }
  ];

  const handleApplySolution = (sol: typeof SOLUTIONS[0]) => {
    sound.playInteract();
    setSelectedSolution(sol.id);
    setLitmusColor(sol.resultColor);
    setLitmusStatusText(`${sol.name} (pH = ${sol.pH}) -> ${sol.desc}`);

    if (!isLitmusDone) {
      setIsLitmusDone(true);
      sound.playSuccess();
      onCompleteExperiment('litmus_test', 120, 100);
    }
  };

  const handleToggleSwitch = () => {
    const next = !isSwitchClosed;
    setIsSwitchClosed(next);
    if (next) {
      sound.playSuccess();
      if (!isCircuitDone) {
        setIsCircuitDone(true);
        onCompleteExperiment('circuit_lamp', 120, 100);
      }
    } else {
      sound.playClick();
    }
  };

  const handleFocusChange = (val: number) => {
    setFocusLevel(val);
    if (val >= 65 && val <= 75 && !isMicroscopeDone) {
      setIsMicroscopeDone(true);
      sound.playSuccess();
      onCompleteExperiment('microscope_cells', 120, 100);
    }
  };

  return (
    <DialogFrame onClose={onClose} labelledBy="dialog-title-stem" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-4xl bg-slate-900 border-2 border-emerald-500/50 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
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

        {/* 2D PIXEL-ART LABORATORY INTERIOR SCENE (INTERACTIVE STATIONS) */}
        <RoomInteriorScene 
          roomId="stem_lab" 
          activeStationId={activeTab}
          onSelectStation={(stId) => {
            sound.playClick();
            setActiveTab(stId as typeof activeTab);
          }}
          completedStations={[
            ...(isLitmusDone ? ['litmus'] : []),
            ...(isCircuitDone ? ['circuit'] : []),
            ...(isMicroscopeDone ? ['microscope'] : [])
          ]}
          npcDialogue="STEM-E: 'Chào bạn! Nhấp trực tiếp vào Bàn Hóa Học, Bàn Mạch Điện hoặc Kính Hiển Vi để bắt đầu nghiên cứu nhé!'"
        />

        {/* DYNAMIC EXPERIMENTS FROM DATABASE */}
        {dynamicExperiments.length > 0 && (
          <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800">
            <h3 className="text-xs font-bold text-cyan-400 mb-2 flex items-center gap-1.5">
              <FlaskConical size={14} /> Thí nghiệm ảo
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {dynamicExperiments.map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => { sound.playClick(); setViewingExperimentId(exp.id); }}
                  className="shrink-0 w-36 bg-slate-800/80 border border-slate-700 rounded-lg p-2 text-left hover:border-cyan-500/30 transition min-h-[44px]"
                >
                  <p className="text-[11px] font-medium text-white truncate">{exp.title}</p>
                  <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400">
                    <Clock size={9} /> {exp.duration_minutes}p
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3D MODELS FROM DATABASE */}
        {models3d.length > 0 && (
          <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800">
            <h3 className="text-xs font-bold text-purple-400 mb-2 flex items-center gap-1.5">
              <Box size={14} /> Mô hình 3D
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {models3d.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    sound.playClick();
                    setViewing3dModelId(m.id);
                    fetch(`/api/models/${m.id}/view`, { method: 'POST' }).catch(() => {});
                  }}
                  className="shrink-0 w-36 bg-slate-800/80 border border-slate-700 rounded-lg p-2 text-left hover:border-purple-500/30 transition min-h-[44px]"
                >
                  <p className="text-[11px] font-medium text-white truncate">{m.title}</p>
                  <p className="text-[9px] text-purple-400 mt-0.5">Xoay & khám phá</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEM MAKER — Grade tabs */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800">
          <h3 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
            <Wrench size={14} /> STEM Maker
          </h3>
          <div className="flex gap-1.5 mb-2">
            {[6, 7, 8, 9].map((g) => (
              <button
                key={g}
                onClick={() => { sound.playClick(); setStemGrade(g); }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition min-h-[36px] ${
                  stemGrade === g
                    ? 'bg-amber-600/30 border border-amber-500/50 text-amber-200'
                    : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Khối {g}
              </button>
            ))}
          </div>
          {(() => {
            const projects = STEM_PROJECTS.filter((p) => p.grade === stemGrade);
            if (projects.length === 0) {
              return (
                <p className="text-[11px] text-slate-500 py-2">
                  Chưa có dự án STEM Maker cho khối {stemGrade}. Sắp ra mắt!
                </p>
              );
            }
            return (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {projects.map((p) => {
                  const task = tasks.find((t) => t.resource_id === p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => { sound.playClick(); setViewingStemProject(p.id); }}
                      className="shrink-0 w-48 bg-slate-800/80 border border-slate-700 rounded-lg p-2.5 text-left hover:border-amber-500/30 transition min-h-[44px]"
                    >
                      <p className="text-xs font-medium text-white flex items-center gap-1.5">
                        <span>{p.icon}</span> {p.title}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                      {task && (
                        <span className={`inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded font-bold ${task.completed ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'}`}>
                          {task.completed ? '✓ Hoàn thành' : '📋 Nhiệm vụ GV'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* STEM Maker fullscreen viewer */}
        {viewingStemProject && (() => {
          const project = STEM_PROJECTS.find((p) => p.id === viewingStemProject);
          if (!project) return null;
          return (
            <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
                <h2 className="text-white font-bold text-sm flex items-center gap-2">
                  <span>{project.icon}</span> {project.title}
                </h2>
                <button
                  onClick={() => setViewingStemProject(null)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1">
                <iframe
                  src={project.url}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                  title={project.title}
                />
              </div>
            </div>
          );
        })()}

        {/* Experiment Viewer overlay */}
        {viewingExperimentId && (
          <ExperimentViewer
            experimentId={viewingExperimentId}
            onClose={() => setViewingExperimentId(null)}
          />
        )}

        {/* 3D Model Viewer overlay */}
        {viewing3dModelId && (() => {
          const model = models3d.find((m) => m.id === viewing3dModelId);
          if (!model) return null;
          return (
            <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
                <h2 className="text-white font-bold text-sm">{model.title}</h2>
                <button
                  onClick={() => setViewing3dModelId(null)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1">
                <iframe
                  src={model.embed_url}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                  title={model.title}
                />
              </div>
            </div>
          );
        })()}

        {/* RESEARCH MISSIONS & REWARD PROGRESS BOARD */}
        <div className="bg-slate-950/60 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 font-bold text-xs">
              {Number(isLitmusDone) + Number(isCircuitDone) + Number(isMicroscopeDone)}/3
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>TIẾN ĐỘ THỬ NGHIỆM STEM KHTN</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                  +120 XP & +100 EP mỗi trạm
                </span>
              </div>
              <div className="text-[11px] text-teal-300/80">
                Hoàn thành cả 3 trạm để mở khóa Danh Hiệu "Nhà Nghiên Cứu STEM Trẻ"!
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'litmus', label: '1. Hóa Học (Quỳ Tím)', done: isLitmusDone, icon: FlaskConical },
              { id: 'circuit', label: '2. Mạch Điện (Vật Lý)', done: isCircuitDone, icon: Zap },
              { id: 'microscope', label: '3. Sinh Học (Hiển Vi)', done: isMicroscopeDone, icon: Eye },
            ].map((st) => {
              const task = tasks.find((t) => t.resource_id === st.id);
              const Icon = st.icon;
              const isSel = activeTab === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setActiveTab(st.id as typeof activeTab);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                    isSel
                      ? 'bg-teal-600/30 border-teal-400 text-teal-200 shadow-md'
                      : st.done
                      ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{st.label}</span>
                  {task && (
                    <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${task.completed ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'}`}>
                      {task.completed ? '✓' : 'GV'}
                    </span>
                  )}
                  {st.done ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 ml-0.5" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-600 ml-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB CONTENTS */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* SIMULATION 1: LITMUS TEST */}
          {activeTab === 'litmus' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Thí nghiệm: Nhận biết Axit - Bazơ bằng giấy quỳ tím
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Nhấp vào các ống nghiệm chứa hóa chất để nhỏ dung dịch lên giấy chỉ thị màu quỳ tím.
                  </p>
                </div>
                {isLitmusDone && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-lg text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Đã hoàn thành (+120 XP)</span>
                  </div>
                )}
              </div>
              {(() => {
                const task = tasks.find((t) => t.resource_id === 'litmus');
                return task && isLitmusDone && !task.completed && (
                  <button type="button" onClick={() => completeTask(task.id)} disabled={completingTask === task.id}
                    className="mt-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold min-h-[36px] disabled:opacity-50">
                    {completingTask === task.id ? 'Đang xác nhận...' : '✅ Hoàn thành nhiệm vụ GV (+35 XP)'}
                  </button>
                );
              })()}

              {/* EXPERIMENT WORKBENCH */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visual Strip Area */}
                <div className="p-6 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col items-center justify-center">
                  <div className="text-xs font-mono text-slate-400 mb-4">
                    BÀN THỰC HÀNH HÓA HỌC
                  </div>

                  {/* Litmus Paper Strip */}
                  <div
                    className="w-36 h-48 rounded-lg shadow-2xl border-4 border-slate-700/80 transition-colors duration-500 flex flex-col items-center justify-center p-3 text-center"
                    style={{ backgroundColor: litmusColor }}
                  >
                    <div className="w-full border-t border-dashed border-white/40 my-2" />
                    <span className="text-xs font-bold text-white uppercase drop-shadow font-mono tracking-wider">
                      GIẤY QUỲ TÍM
                    </span>
                    <div className="w-full border-t border-dashed border-white/40 my-2" />
                  </div>

                  {/* Status Banner */}
                  <div className="mt-4 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-center text-slate-200 w-full">
                    {litmusStatusText}
                  </div>
                </div>

                {/* Chemical Reagents Selection */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Chọn dung dịch cần thử nghiệm:
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {SOLUTIONS.map((sol) => (
                      <button
                        key={sol.id}
                        type="button"
                        onClick={() => handleApplySolution(sol)}
                        className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                          selectedSolution === sol.id
                            ? 'bg-emerald-600/20 border-emerald-400 text-white'
                            : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs">{sol.name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Loại: <span className="text-emerald-300 font-semibold">{sol.type}</span> (pH = {sol.pH})
                          </div>
                        </div>

                        <span className="px-3 py-1 bg-slate-700/80 rounded-lg text-xs font-semibold text-slate-200">
                          Nhỏ giọt
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Theoretical Note */}
                  <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl text-[11px] text-slate-400 space-y-1">
                    <div className="font-bold text-slate-300">Ghi nhớ KHTN THCS:</div>
                    <div>• pH &lt; 7: Dung dịch có tính axit, làm quỳ tím hóa đỏ.</div>
                    <div>• pH = 7: Dung dịch trung tính, quỳ tím không đổi màu.</div>
                    <div>• pH &gt; 7: Dung dịch có tính bazơ, làm quỳ tím hóa xanh.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SIMULATION 2: ELECTRIC CIRCUIT */}
          {activeTab === 'circuit' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Thí nghiệm: Lắp mạch điện kín thắp sáng bóng đèn
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Đóng khóa K để dòng điện chạy từ cực dương sang cực âm qua bóng đèn.
                  </p>
                </div>
                {isCircuitDone && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-lg text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Đã hoàn thành (+120 XP)</span>
                  </div>
                )}
              </div>
              {(() => {
                const task = tasks.find((t) => t.resource_id === 'circuit');
                return task && isCircuitDone && !task.completed && (
                  <button type="button" onClick={() => completeTask(task.id)} disabled={completingTask === task.id}
                    className="mt-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold min-h-[36px] disabled:opacity-50">
                    {completingTask === task.id ? 'Đang xác nhận...' : '✅ Hoàn thành nhiệm vụ GV (+35 XP)'}
                  </button>
                );
              })()}

              {/* CIRCUIT SCHEMATIC CANVAS / SVG */}
              <div className="p-8 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center">
                <svg viewBox="0 0 400 240" className="w-full max-w-lg">
                  {/* Outer Wire Rectangle */}
                  <rect
                    x="40"
                    y="30"
                    width="320"
                    height="180"
                    fill="none"
                    stroke={isSwitchClosed ? '#38BDF8' : '#64748B'}
                    strokeWidth="4"
                    strokeDasharray={isSwitchClosed ? '10 5' : 'none'}
                    className={isSwitchClosed ? 'animate-pulse' : ''}
                  />

                  {/* BATTERY (Left wire interruption) */}
                  <rect x="36" y="90" width="8" height="60" fill="#0F172A" />
                  {/* Positive Long Plate */}
                  <line x1="30" y1="105" x2="50" y2="105" stroke="#EF4444" strokeWidth="4" />
                  <text x="18" y="110" fill="#EF4444" fontSize="12" fontWeight="bold">+</text>
                  {/* Negative Short Thick Plate */}
                  <line x1="35" y1="135" x2="45" y2="135" stroke="#3B82F6" strokeWidth="6" />
                  <text x="20" y="140" fill="#3B82F6" fontSize="12" fontWeight="bold">-</text>

                  {/* SWITCH K (Top wire interruption) */}
                  <rect x="170" y="26" width="60" height="12" fill="#0F172A" />
                  <circle cx="175" cy="30" r="4" fill="#E2E8F0" />
                  <circle cx="225" cy="30" r="4" fill="#E2E8F0" />
                  {/* Switch Blade */}
                  <line
                    x1="175"
                    y1="30"
                    x2={isSwitchClosed ? 225 : 210}
                    y2={isSwitchClosed ? 30 : 12}
                    stroke="#F59E0B"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <text x="195" y="12" fill="#FCD34D" fontSize="11" fontWeight="bold">Khóa K</text>

                  {/* LIGHT BULB (Right wire interruption) */}
                  <circle
                    cx="360"
                    cy="120"
                    r="24"
                    fill={isSwitchClosed ? '#FEF08A' : '#1E293B'}
                    stroke="#E2E8F0"
                    strokeWidth="2.5"
                  />
                  {/* Filament */}
                  <path
                    d="M 352 125 Q 360 110 368 125"
                    fill="none"
                    stroke={isSwitchClosed ? '#EF4444' : '#64748B'}
                    strokeWidth="2.5"
                  />
                  {isSwitchClosed && (
                    <circle cx="360" cy="120" r="40" fill="#FEF08A22" />
                  )}
                </svg>

                {/* Switch Button */}
                <div className="mt-6 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleToggleSwitch}
                    className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition transform active:scale-95 cursor-pointer shadow-lg ${
                      isSwitchClosed
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    }`}
                  >
                    {isSwitchClosed ? 'Ngắt Khóa K (Mở Mạch)' : 'Đóng Khóa K (Bật Đèn)'}
                  </button>

                  <div className="text-xs text-slate-300">
                    Trạng thái: <span className="font-bold text-amber-400">{isSwitchClosed ? 'Mạch Kín - Đèn Sáng' : 'Mạch Hở - Đèn Tắt'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SIMULATION 3: MICROSCOPE CELL */}
          {activeTab === 'microscope' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Thí nghiệm: Kính hiển vi quan sát tế bào thực vật (Biểu bì vảy hành)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Xoay ốc vi cấp (thanh trượt) để điều chỉnh tiêu cự cho đến khi hình ảnh tế bào rõ nét!
                  </p>
                </div>
                {isMicroscopeDone && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-lg text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Đã hoàn thành (+120 XP)</span>
                  </div>
                )}
              </div>
              {(() => {
                const task = tasks.find((t) => t.resource_id === 'microscope');
                return task && isMicroscopeDone && !task.completed && (
                  <button type="button" onClick={() => completeTask(task.id)} disabled={completingTask === task.id}
                    className="mt-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold min-h-[36px] disabled:opacity-50">
                    {completingTask === task.id ? 'Đang xác nhận...' : '✅ Hoàn thành nhiệm vụ GV (+35 XP)'}
                  </button>
                );
              })()}

              {/* LENS VIEWPORT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center">
                  <div className="relative w-56 h-56 rounded-full overflow-hidden border-8 border-slate-800 shadow-2xl bg-emerald-950 flex items-center justify-center">
                    {/* Blurred / Focused Cell Pattern */}
                    <div
                      className="w-full h-full p-4 grid grid-cols-3 grid-rows-3 gap-1 transition-all"
                      style={{
                        filter: `blur(${Math.abs(focusLevel - 70) * 0.25}px)`,
                        opacity: Math.max(0.4, 1 - Math.abs(focusLevel - 70) * 0.015),
                      }}
                    >
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div
                          key={i}
                          className="border-2 border-emerald-400/80 rounded bg-emerald-700/40 relative flex items-center justify-center"
                        >
                          {/* Cell Nucleus */}
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-200 shadow" />
                          {/* Chloroplasts */}
                          <div className="w-1 h-1 rounded-full bg-green-300 absolute top-1 left-1" />
                          <div className="w-1 h-1 rounded-full bg-green-300 absolute bottom-1 right-1" />
                        </div>
                      ))}
                    </div>

                    {/* Reticle Crosshairs */}
                    <div className="absolute inset-0 pointer-events-none border border-slate-500/20 rounded-full flex items-center justify-center">
                      <div className="w-full h-[1px] bg-slate-400/30" />
                      <div className="h-full w-[1px] bg-slate-400/30 absolute" />
                    </div>
                  </div>

                  <div className="mt-3 text-xs font-mono text-slate-400">
                    Độ phóng đại: 400x (Thị kính 10x × Vật kính 40x)
                  </div>
                </div>

                {/* FOCUS CONTROLLER */}
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                      <span>Ốc vi cấp (Điều chỉnh tiêu cự):</span>
                      <span className="font-mono text-emerald-400">{focusLevel}%</span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={focusLevel}
                      onChange={(e) => handleFocusChange(Number(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />

                    <div className="text-[11px] text-slate-400">
                      Gợi ý: Kéo thanh trượt đến khoảng <strong className="text-emerald-300">65% - 75%</strong> để đạt điểm lấy nét tối ưu.
                    </div>
                  </div>

                  {focusLevel >= 65 && focusLevel <= 75 ? (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-700 rounded-xl text-xs text-emerald-200 font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Hình ảnh tế bào đạt tiêu cự sắc nét! Quan sát rõ thành tế bào và nhân.</span>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-800/40 border border-slate-700 rounded-xl text-xs text-slate-400">
                      Tiêu cự chưa chuẩn, tế bào đang bị mờ nhòe.
                    </div>
                  )}

                  <div className="p-3 bg-slate-800/20 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <div className="font-bold text-slate-300">Cấu tạo nhận diện:</div>
                    <div>• <strong>Thành tế bào:</strong> Vách ngăn cứng bao quanh bảo vệ hình dạng.</div>
                    <div>• <strong>Nhân tế bào:</strong> Chấm tròn đậm màu chứa ADN.</div>
                    <div>• <strong>Lục lạp:</strong> Hạt xanh chứa chất diệp lục.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DialogFrame>
  );
};
