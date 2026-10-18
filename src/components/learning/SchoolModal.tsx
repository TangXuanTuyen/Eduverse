/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerProgress, Quest } from '../../types/game.ts';
import { sound } from '../../utils/audio.ts';
import { School, CheckCircle2, Clock, Gift, X, Sparkles, BookOpen, ArrowLeft } from 'lucide-react';
import { RoomInteriorScene } from './RoomInteriorScene.tsx';

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
  const handleClaim = (q: Quest) => {
    sound.playSuccess();
    onClaimQuest(q.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-900 border-2 border-blue-500/50 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-950/90 via-slate-900 to-indigo-950/80 border-b border-blue-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/50 flex items-center justify-center text-xl">
              🏫
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Trường THCS EDUVERSE (School)
              </h2>
              <p className="text-xs text-blue-300">
                Bảng phân công nhiệm vụ học tập, bài tập về nhà & thông báo giáo viên
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại thành phố</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Đóng [Esc]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2D PIXEL-ART CLASSROOM INTERIOR SCENE */}
        <RoomInteriorScene roomId="school" />

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* TEACHER'S MESSAGE BANNER */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-700/50 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow">
              Cô Lan
            </div>
            <div>
              <div className="text-xs font-bold text-blue-300">
                Thầy Cô Bộ Môn Khoa Học Tự Nhiên nhắn nhủ:
              </div>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                "Chào mừng các em học sinh đến với thành phố EDUVERSE! Hãy chủ động ghé thăm Thư viện để nắm chắc lý thuyết, luyện phản xạ tại Quiz Arcade và kiểm chứng kiến thức trong Phòng thí nghiệm STEM nhé!"
              </p>
            </div>
          </div>

          {/* ACTIVE ASSIGNMENTS / QUESTS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
              <span>Nhiệm vụ tuần này ({progress.quests.length}):</span>
              <span className="text-amber-400">Tích lũy XP & EduPoints</span>
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
                          Đã nhận thưởng
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{q.description}</p>
                    <div className="mt-2 flex items-center gap-3 text-[11px]">
                      <span className="text-amber-400 font-mono font-bold">
                        +{q.rewardXP} XP / +{q.rewardPoints} EduPoints
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 w-full sm:w-auto flex justify-end">
                    {q.claimed ? (
                      <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Hoàn tất
                      </span>
                    ) : q.completed ? (
                      <button
                        type="button"
                        onClick={() => handleClaim(q)}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition active:scale-95 cursor-pointer animate-bounce"
                      >
                        <Gift className="w-4 h-4" />
                        <span>Nhận thưởng</span>
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
        </div>
      </div>
    </div>
  );
};
