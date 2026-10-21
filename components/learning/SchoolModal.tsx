'use client';

import React, { useEffect, useState } from 'react';
import { PlayerProgress, Quest } from '@/types/game';
import { sound } from '@/lib/audio';
import { School, CheckCircle2, Clock, Gift, X, BookOpen, ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import { RoomInteriorScene } from './RoomInteriorScene';
import { DialogFrame } from '@/components/ui/DialogFrame';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type RealAssignment = {
  id: string;
  title: string;
  description: string;
  due_at: string | null;
  assignment_type?: 'quiz' | 'lesson' | 'experiment';
  resource_id?: string | null;
  resource_title?: string | null;
  rooms: { name: string };
};

interface SchoolModalProps {
  progress: PlayerProgress;
  onClose: () => void;
  onClaimQuest: (questId: string) => void;
}

export const SchoolModal: React.FC<SchoolModalProps> = ({
  progress,
  onClose,
  onClaimQuest,
}) => {
  const router = useRouter();
  const [assignments, setAssignments] = useState<RealAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/student-assignments');
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setAssignments(data.assignments ?? []);
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleClaim = (q: Quest) => {
    sound.playSuccess();
    onClaimQuest(q.id);
  };

  const now = new Date();

  return (
    <DialogFrame onClose={onClose} labelledBy="dialog-title-school" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-3xl bg-slate-900 border-2 border-blue-500/50 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-950/90 via-slate-900 to-indigo-950/80 border-b border-blue-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/50 flex items-center justify-center text-xl">
              🏫
            </div>
            <div>
              <h2 id="dialog-title-school" className="text-base font-bold text-white">
                Trường THCS VINA-EDUVERSE
              </h2>
              <p className="text-xs text-blue-300">
                Bài giao từ giáo viên, nhiệm vụ học tập & thông báo
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
              <span className="hidden sm:inline">Quay lại</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <RoomInteriorScene roomId="school" />

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* REAL ASSIGNMENTS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-400" />
                Bài giao từ giáo viên
              </span>
              <Link
                href="/student/assignments/real"
                className="text-blue-400 hover:text-blue-300 normal-case font-medium underline"
              >
                Xem tất cả →
              </Link>
            </div>

            {loading ? (
              <p className="text-sm text-slate-500 text-center py-4">Đang tải...</p>
            ) : assignments.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Chưa có bài giao nào từ giáo viên</p>
              </div>
            ) : (
              <div className="space-y-2">
                {assignments.slice(0, 8).map((a) => {
                  const overdue = a.due_at && new Date(a.due_at) < now;
                  const isTask = a.assignment_type === 'lesson' || a.assignment_type === 'experiment';
                  const typeIcon = a.assignment_type === 'lesson' ? '📖' : a.assignment_type === 'experiment' ? '🔬' : '📝';
                  const buildingLabel = a.assignment_type === 'lesson' ? 'Đi đến Thư viện' : 'Đi đến Phòng TN Ảo';
                  const buildingRoute = a.assignment_type === 'lesson' ? '/student/library' : '/student/virtual_lab';

                  if (isTask) {
                    return (
                      <div
                        key={a.id}
                        className="p-4 rounded-xl border bg-slate-800/60 border-slate-700"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-white">{typeIcon} {a.title}</span>
                          {overdue ? (
                            <span className="text-[10px] text-red-400 bg-red-950/60 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Quá hạn
                            </span>
                          ) : a.due_at ? (
                            <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {new Date(a.due_at).toLocaleDateString('vi-VN')}
                            </span>
                          ) : null}
                        </div>
                        {a.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{a.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-slate-500">{a.rooms.name}</p>
                          <button
                            type="button"
                            onClick={() => { onClose(); router.push(buildingRoute); }}
                            className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium min-h-[36px] transition"
                          >
                            {buildingLabel} →
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={a.id}
                      href={`/student/assignments/real/${a.id}`}
                      className="block p-4 rounded-xl border bg-slate-800/60 border-slate-700 hover:border-blue-500/50 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{typeIcon} {a.title}</span>
                        {overdue ? (
                          <span className="text-[10px] text-red-400 bg-red-950/60 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Quá hạn
                          </span>
                        ) : a.due_at ? (
                          <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(a.due_at).toLocaleDateString('vi-VN')}
                          </span>
                        ) : null}
                      </div>
                      {a.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{a.description}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">{a.rooms.name}</p>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* QUESTS */}
          {progress.quests.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Nhiệm vụ khám phá ({progress.quests.filter((q) => !q.claimed).length} còn lại)
              </div>

              <div className="space-y-2.5">
                {progress.quests.map((q) => (
                  <div
                    key={q.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition ${
                      q.claimed
                        ? 'bg-slate-900/40 border-slate-800 opacity-60'
                        : q.completed
                        ? 'bg-emerald-950/30 border-emerald-500/80 shadow-lg shadow-emerald-950/30'
                        : 'bg-slate-800/60 border-slate-700'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{q.title}</span>
                        {q.claimed && (
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                            Đã nhận
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{q.description}</p>
                      <span className="text-[11px] text-amber-400 font-mono font-bold mt-1 block">
                        +{q.rewardXP} XP / +{q.rewardPoints} EP
                      </span>
                    </div>

                    <div className="shrink-0">
                      {q.claimed ? (
                        <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Hoàn tất
                        </span>
                      ) : q.completed ? (
                        <button
                          type="button"
                          onClick={() => handleClaim(q)}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 transition active:scale-95 cursor-pointer min-h-[44px]"
                        >
                          <Gift className="w-4 h-4" /> Nhận thưởng
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-amber-400" /> Đang thực hiện
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DialogFrame>
  );
};
