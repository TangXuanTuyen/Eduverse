/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useState } from 'react';
import {
  BuildingId,
  BuildingInfo,
  CharacterConfig,
  PlayerProgress,
} from '@/types/game';
import { BUILDINGS } from '@/game/engine/cityData';
import { ProgressionSystem } from '@/game/engine/progression';
import { PixelAvatar } from '@/components/character/PixelAvatar';
import { sound } from '@/lib/audio';
import { DialogFrame } from '@/components/ui/DialogFrame';
import type { BuildingNotification } from '@/game/config/town-map';
import {
  Volume2,
  VolumeX,
  UserCog,
  LogOut,
  Compass,
  Scroll,
  Lock,
  ArrowRight,
  Zap,
  Award,
  CheckCircle2,
  X,
  List,
  Map,
  Bell,
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { LanguageSwitch } from '@/components/i18n/LanguageSwitch';

interface CityHUDProps {
  character: CharacterConfig;
  progress: PlayerProgress;
  onEditCharacter: () => void;
  onFastTravel: (b: BuildingInfo) => void;
  onDirectEnter: (b: BuildingInfo) => void;
  onClaimQuestReward?: (questId: string) => void;
  fastTravelOpen?: boolean;
  onFastTravelOpenChange?: (open: boolean) => void;
  listMode?: boolean;
  onToggleListMode?: () => void;
  notifications?: Record<BuildingId, BuildingNotification[]>;
}

export const CityHUD: React.FC<CityHUDProps> = ({
  character,
  progress,
  onEditCharacter,
  onFastTravel,
  onDirectEnter,
  onClaimQuestReward: _onClaimQuestReward,
  fastTravelOpen,
  onFastTravelOpenChange,
  listMode,
  onToggleListMode,
  notifications,
}) => {
  const [internalFastTravel, setInternalFastTravel] = useState(false);
  const showFastTravelModal = fastTravelOpen ?? internalFastTravel;
  const setShowFastTravelModal = (open: boolean) => {
    setInternalFastTravel(open);
    onFastTravelOpenChange?.(open);
  };
  const [showQuestsModal, setShowQuestsModal] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.isMuted());

  const handleToggleMute = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
  };

  const xpPercent = Math.min(
    100,
    Math.round((progress.currentXP / progress.nextLevelXP) * 100)
  );

  return (
    <>
      {/* TOP FLOATING SLIM HUD DOCK */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-30 pointer-events-none flex items-center justify-between gap-2">
        {/* COMPACT STUDENT PROFILE DOCK (Sufficient width to display full student name) */}
        <div className="pointer-events-auto bg-slate-900/90 border border-slate-700/70 backdrop-blur-md rounded-xl p-1 pr-2 sm:p-1.5 sm:px-3 shadow-lg flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 sm:flex-none sm:min-w-[280px] max-w-sm sm:max-w-md transition-all">
          {/* Avatar Icon */}
          <button
            type="button"
            onClick={onEditCharacter}
            aria-label="Đổi trang phục nhân vật"
            className="w-11 h-11 bg-slate-800 rounded-lg border border-indigo-500/40 flex items-center justify-center cursor-pointer hover:border-indigo-400 transition overflow-hidden shrink-0"
            title="Nhấn để đổi trang phục nhân vật"
          >
            <PixelAvatar config={character} size={34} direction="down" />
          </button>

          {/* Student Info & Level Bar */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-white truncate">
                {character.name || 'Học Sinh VINA-EDUVERSE'}
              </span>
              <span className="hidden sm:inline text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1 py-0.2 rounded font-semibold shrink-0">
                {character.className}
              </span>
            </div>

            {/* Level & XP Bar */}
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-1 py-0.2 rounded shrink-0">
                CẤP {progress.level}
              </span>

              {/* Progress track */}
              <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700/80">
                <div
                  className="bg-gradient-to-r from-amber-400 to-yellow-300 h-full transition-all duration-300"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>

              <span className="text-[8px] font-mono text-slate-400 shrink-0">
                {progress.currentXP}/{progress.nextLevelXP}
              </span>
            </div>
          </div>
        </div>

        {/* COMPACT TOP RIGHT UTILITY BAR */}
        <div className="pointer-events-auto flex items-center gap-1 sm:gap-1.5 shrink-0">
          <LanguageSwitch />
          {/* EduPoints pill */}
          <div className="hidden sm:flex bg-slate-900/85 border border-amber-500/40 text-amber-300 px-2.5 py-1 rounded-lg text-xs font-bold items-center gap-1 shadow-md backdrop-blur-md">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="font-mono">{progress.eduPoints} EP</span>
          </div>

          {/* Notification Bell */}
          <NotificationBell />

          {/* Quests Button */}
          <button
            type="button"
            aria-label="Xem nhiệm vụ học tập"
            onClick={() => {
              sound.playClick();
              setShowQuestsModal(true);
            }}
            className="relative min-h-11 min-w-11 justify-center px-2.5 py-1 bg-slate-900/85 hover:bg-slate-800 border border-slate-700/70 text-slate-200 rounded-lg text-xs font-semibold shadow-md backdrop-blur-md flex items-center gap-1 cursor-pointer transition hover:text-white"
          >
            <Scroll className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Nhiệm Vụ</span>
            {progress.quests.some((q) => !q.completed) && (
              <span aria-hidden="true" className="w-2 h-2 rounded-full bg-amber-400 absolute top-1 right-1" />
            )}
          </button>

          {/* Quick Travel / List of Zones */}
          <button
            type="button"
            aria-label="Mở danh sách khu vực thành phố"
            onClick={() => {
              sound.playClick();
              setShowFastTravelModal(true);
            }}
            className="min-h-11 min-w-11 justify-center px-2.5 py-1 bg-indigo-600/85 hover:bg-indigo-600 text-white border border-indigo-400/40 rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 backdrop-blur-md flex items-center gap-1 cursor-pointer transition active:scale-95"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Khu Vực</span>
          </button>

          {/* Edit Avatar */}
          <button
            type="button"
            aria-label="Tùy chỉnh diện mạo nhân vật"
            onClick={() => {
              sound.playClick();
              onEditCharacter();
            }}
            className="min-h-11 min-w-11 flex items-center justify-center bg-slate-900/85 hover:bg-slate-800 border border-slate-700/70 text-slate-200 rounded-lg shadow-md backdrop-blur-md cursor-pointer transition hover:text-white"
            title="Đổi trang phục & nhân vật"
          >
            <UserCog className="w-4 h-4 text-indigo-300" />
          </button>

          {/* List/Map Mode Toggle */}
          {onToggleListMode && (
            <button
              type="button"
              aria-label={listMode ? 'Bật chế độ bản đồ' : 'Bật chế độ danh sách'}
              onClick={() => {
                sound.playClick();
                onToggleListMode();
              }}
              className="min-h-11 min-w-11 flex items-center justify-center bg-slate-900/85 hover:bg-slate-800 border border-slate-700/70 text-slate-200 rounded-lg shadow-md backdrop-blur-md cursor-pointer transition hover:text-white"
              title={listMode ? 'Chế độ bản đồ' : 'Chế độ danh sách (máy yếu)'}
            >
              {listMode ? <Map className="w-4 h-4 text-emerald-400" /> : <List className="w-4 h-4 text-slate-300" />}
            </button>
          )}

          {/* Sound Mute */}
          <button
            type="button"
            aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            onClick={handleToggleMute}
            className="min-h-11 min-w-11 flex items-center justify-center bg-slate-900/85 hover:bg-slate-800 border border-slate-700/70 text-slate-200 rounded-lg shadow-md backdrop-blur-md cursor-pointer transition hover:text-white"
            title="Bật/Tắt âm thanh [M]"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-slate-300" />}
          </button>

          {/* Đăng xuất (POST, máy dùng chung trong lớp cần thoát nhanh) */}
          <form action="/auth/dang-xuat" method="post">
            <button
              type="submit"
              aria-label="Đăng xuất"
              title="Đăng xuất"
              className="min-h-11 min-w-11 flex items-center justify-center bg-slate-900/85 hover:bg-slate-800 border border-slate-700/70 text-slate-200 rounded-lg shadow-md backdrop-blur-md cursor-pointer transition hover:text-white"
            >
              <LogOut className="w-4 h-4 text-slate-300" />
            </button>
          </form>
        </div>
      </div>

      {/* FAST TRAVEL & ZONE DIRECTORY MODAL */}
      {showFastTravelModal && (
        <DialogFrame onClose={() => setShowFastTravelModal(false)} labelledBy="dialog-title-zones" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-6 text-slate-100 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-400" />
                <h3 id="dialog-title-zones" className="text-base font-bold text-white">
                  Danh Sách Khu Vực Học Tập Thành Phố
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFastTravelModal(false)}
                aria-label="Đóng"
                className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 my-3">
              Bạn có thể dịch chuyển nhanh nhân vật đến trước cửa công trình, hoặc mở trực tiếp bài học để làm bài ngay!
            </p>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {Object.values(BUILDINGS).map((b) => {
                const status = ProgressionSystem.isBuildingUnlocked(b.id, progress);
                return (
                  <div
                    key={b.id}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition ${
                      !status.unlocked
                        ? 'bg-slate-900/60 border-slate-800 opacity-60'
                        : 'bg-slate-800/60 border-slate-700 hover:border-indigo-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ backgroundColor: b.color }}
                      >
                        {b.icon}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-2">
                          {b.vietnameseName}
                          {!status.unlocked && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                          {notifications?.[b.id]?.map((n, i) => (
                            <span key={i} className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded-full font-semibold">
                              <Bell className="w-3 h-3" />{n.label}
                            </span>
                          ))}
                        </div>
                        <div className="text-xs text-slate-400">{b.description}</div>
                        {!status.unlocked && status.reason && (
                          <div className="text-[11px] text-amber-400 mt-1 font-medium">
                            {status.reason}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                      {status.unlocked ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              sound.playInteract();
                              setShowFastTravelModal(false);
                              onFastTravel(b);
                            }}
                            className="min-h-11 px-3 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition cursor-pointer"
                            title="Đưa nhân vật bước đến trước cửa"
                          >
                            Đến trước cửa
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              sound.playInteract();
                              setShowFastTravelModal(false);
                              onDirectEnter(b);
                            }}
                            className="min-h-11 px-3.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow transition cursor-pointer flex items-center gap-1"
                          >
                            <span>Vào học ngay</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-rose-400 font-semibold px-2 py-1 bg-rose-950/60 rounded">
                          Chưa mở khóa
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogFrame>
      )}

      {/* QUESTS MODAL */}
      {showQuestsModal && (
        <DialogFrame onClose={() => setShowQuestsModal(false)} labelledBy="dialog-title-quests" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 text-slate-100 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Scroll className="w-5 h-5 text-emerald-400" />
                <h3 id="dialog-title-quests" className="text-base font-bold text-white">Nhiệm Vụ Học Tập THCS</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuestsModal(false)}
                aria-label="Đóng"
                className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 my-3">
              Hoàn thành các nhiệm vụ do giáo viên giao tại từng khu vực thành phố để nhận XP và EduPoints!
            </p>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {progress.quests.map((q) => (
                <div
                  key={q.id}
                  className={`p-3.5 rounded-xl border ${
                    q.completed
                      ? 'bg-emerald-950/20 border-emerald-800/60'
                      : 'bg-slate-800/60 border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{q.title}</span>
                    <span className="text-[10px] text-amber-400 font-mono font-semibold">
                      +{q.rewardXP} XP / +{q.rewardPoints} EP
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{q.description}</p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] text-indigo-300">
                      Địa điểm: {BUILDINGS[q.locationId]?.vietnameseName}
                    </span>

                    {q.completed ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn thành
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setShowQuestsModal(false);
                          const b = BUILDINGS[q.locationId];
                          if (b) onFastTravel(b);
                        }}
                        className="min-h-11 px-1 text-xs text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
                      >
                        Chỉ đường tới đây &rarr;
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogFrame>
      )}
    </>
  );
};
