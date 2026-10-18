/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CharacterConfig, PlayerProgress } from '../../types/game.ts';
import { PixelAvatar } from '../character/PixelAvatar.tsx';
import { Trophy, Award, Lock, CheckCircle2, UserCog, Sparkles, X, ArrowLeft } from 'lucide-react';
import { RoomInteriorScene } from './RoomInteriorScene.tsx';

interface AchievementPlazaModalProps {
  character: CharacterConfig;
  progress: PlayerProgress;
  onClose: () => void;
  onOpenCustomizer: () => void;
}

export const AchievementPlazaModal: React.FC<AchievementPlazaModalProps> = ({
  character,
  progress,
  onClose,
  onOpenCustomizer,
}) => {
  const BADGES = [
    {
      id: 'b1',
      title: 'Tân Binh EDUVERSE',
      desc: 'Gia nhập thành phố và tạo nhân vật đại diện',
      icon: '🌱',
      unlocked: true,
    },
    {
      id: 'b2',
      title: 'Chiến Binh Quiz Arcade',
      desc: 'Vượt qua bài thi trắc nghiệm KHTN tính giờ',
      icon: '⚡',
      unlocked: progress.quizzesCompleted >= 1,
      requirement: 'Hoàn thành 1 ván Quiz Arcade',
    },
    {
      id: 'b3',
      title: 'Nhà Sáng Chế STEM',
      desc: 'Tiến hành thành công thí nghiệm thực hành',
      icon: '🧪',
      unlocked: progress.experimentsCompleted.length >= 1,
      requirement: 'Hoàn thành 1 thí nghiệm tại STEM Lab',
    },
    {
      id: 'b4',
      title: 'Bậc Thầy Sửa Lỗi',
      desc: 'Chữa lành các hiểu lầm và sửa câu sai',
      icon: '🛡️',
      unlocked: progress.mistakes.some((m) => m.reviewed),
      requirement: 'Sửa thành công 1 lỗi sai tại Trạm Sửa Lỗi',
    },
  ];

  const OUTFITS_SHOWCASE = [
    {
      id: 'thcs_uniform',
      name: 'Đồng Phục THCS Khăn Quàng Đỏ',
      icon: '👔',
      unlocked: true,
      condition: 'Trang phục khởi đầu',
    },
    {
      id: 'sport',
      name: 'Bộ Thể Thao Năng Động',
      icon: '👟',
      unlocked: true,
      condition: 'Trang phục ngoại khóa',
    },
    {
      id: 'hoodie',
      name: 'Áo Hoodie Học Sinh Hiện Đại',
      icon: '🧥',
      unlocked: progress.level >= 2,
      condition: 'Đạt Cấp 2',
    },
    {
      id: 'stem_coat',
      name: 'Áo Blouse Nhà Khoa Học Cấp Cao',
      icon: '🥼',
      unlocked: progress.experimentsCompleted.length >= 1,
      condition: 'Làm 1 thí nghiệm STEM',
    },
    {
      id: 'astronaut',
      name: 'Bộ Thám Hiểm Vũ Trụ',
      icon: '🚀',
      unlocked: progress.level >= 4,
      condition: 'Đạt Cấp 4',
    },
    {
      id: 'vr_headset',
      name: 'Kính Thực Tế Ảo Cyber VR',
      icon: '🥽',
      unlocked: progress.quizzesCompleted >= 1,
      condition: 'Thắng 1 ván Quiz Arcade',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border-2 border-amber-500/50 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-950/90 via-slate-900 to-yellow-950/80 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/30 text-amber-400 border border-amber-500/50 flex items-center justify-center text-xl">
              🏆
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Quảng Trường Vinh Danh (Achievement Plaza)
              </h2>
              <p className="text-xs text-amber-300">
                Bảng vàng thành tích, bộ sưu tập huy hiệu & mở khóa trang phục học tập
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

        {/* 2D PIXEL-ART HALL OF FAME INTERIOR SCENE */}
        <RoomInteriorScene roomId="achievement_plaza" />

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* STUDENT HERO BANNER */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 shadow-inner">
                <PixelAvatar config={character} size={72} direction="down" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{character.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">
                    {character.className}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Danh hiệu: <strong className="text-amber-400 font-bold">Cấp {progress.level} - Nhà Khám Phá Tri Thức</strong>
                </div>
                <div className="text-xs text-slate-300 font-mono mt-2 flex items-center gap-4">
                  <span>✨ {progress.currentXP}/{progress.nextLevelXP} XP</span>
                  <span>⚡ {progress.eduPoints} EduPoints</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCustomizer();
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <UserCog className="w-4 h-4" />
              <span>Phòng Thay Đồ / Tùy Chỉnh</span>
            </button>
          </div>

          {/* HUY HIỆU DANH DỰ (BADGES) */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Huy hiệu học tập đạt được ({BADGES.filter((b) => b.unlocked).length}/{BADGES.length}):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BADGES.map((b) => (
                <div
                  key={b.id}
                  className={`p-3.5 rounded-xl border flex items-center gap-3.5 transition ${
                    b.unlocked
                      ? 'bg-amber-950/20 border-amber-600/50 shadow-md shadow-amber-950/30'
                      : 'bg-slate-900/50 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl shrink-0 border border-slate-700">
                    {b.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-white flex items-center justify-between">
                      <span className="truncate">{b.title}</span>
                      {b.unlocked ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{b.desc}</div>
                    {!b.unlocked && b.requirement && (
                      <div className="text-[10px] text-amber-400 mt-1 font-medium">
                        Điều kiện: {b.requirement}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BỘ SƯU TẬP TRANG PHỤC HỌC ĐƯỜNG (WARDROBE UNLOCKS) */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Kho trang phục & phụ kiện học sinh (Mở khóa 100% bằng thành tích):</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {OUTFITS_SHOWCASE.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border flex flex-col justify-between ${
                    item.unlocked
                      ? 'bg-slate-800/80 border-indigo-500/40 text-slate-100'
                      : 'bg-slate-900/60 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{item.icon}</span>
                    {item.unlocked ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded">
                        ĐÃ MỞ
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded flex items-center gap-1">
                        <Lock className="w-3 h-3" /> KHÓA
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-xs text-white line-clamp-1">{item.name}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{item.condition}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
