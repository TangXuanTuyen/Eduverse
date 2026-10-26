/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CharacterConfig } from '@/types/game';
import { PixelAvatar } from '@/components/character/PixelAvatar';
import { Award, Lock, CheckCircle2, UserCog, Sparkles, X, ArrowLeft, Loader2 } from 'lucide-react';
import { RoomInteriorScene } from './RoomInteriorScene';
import { DialogFrame } from '@/components/ui/DialogFrame';

interface AchievementPlazaModalProps {
  character: CharacterConfig;
  onClose: () => void;
  onOpenCustomizer: () => void;
  roomId?: string | null;
}

type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  criteria: Record<string, unknown>;
  xp_reward: number;
  awarded: boolean;
  awarded_at?: string;
};

type XpSummary = {
  totalXp: number;
  level: number;
  xpToday: number;
  dailyCap: number;
  xpThisWeek: number;
  xpLastWeek: number;
  currentStreak: number;
  longestStreak: number;
};

type LeaderboardEntry = {
  user_id: string;
  display_name: string;
  level: number;
  total_xp: number;
  rank: number;
};

export const AchievementPlazaModal: React.FC<AchievementPlazaModalProps> = ({
  character,
  onClose,
  onOpenCustomizer,
  roomId,
}) => {
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [xp, setXp] = useState<XpSummary | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/achievements')
      .then((r) => r.json())
      .then((data) => {
        setBadges(data.badges ?? []);
        setXp(data.xp ?? null);
      })
      .catch(() => setError('Không tải được thành tích'))
      .finally(() => setLoading(false));

    if (roomId) {
      fetch(`/api/leaderboard?roomId=${encodeURIComponent(roomId)}`)
        .then((r) => r.json())
        .then((data) => setLeaderboard(data.leaderboard ?? []))
        .catch(() => {});
    }
  }, [roomId]);

  const unlockedCount = badges.filter((b) => b.awarded).length;
  const nextLevelXp = xp ? (xp.level + 1) * 100 : 100;
  const xpProgress = xp ? Math.min((xp.totalXp / nextLevelXp) * 100, 100) : 0;

  return (
    <DialogFrame onClose={onClose} labelledBy="dialog-title-achievements" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-4xl bg-slate-900 border-2 border-amber-500/50 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-950/90 via-slate-900 to-yellow-950/80 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/30 text-amber-400 border border-amber-500/50 flex items-center justify-center text-xl">
              🏆
            </div>
            <div>
              <h2 id="dialog-title-achievements" className="text-base font-bold text-white">
                Quảng Trường Vinh Danh
              </h2>
              <p className="text-xs text-amber-300">
                Thành tích, huy hiệu & XP
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
              title="Đóng [Esc]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <RoomInteriorScene roomId="achievement_plaza" />

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-sm text-red-400">{error}</div>
          ) : (
            <>
              {/* XP BANNER */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-5">
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
                    {xp && (
                      <>
                        <div className="text-xs text-slate-400 mt-1">
                          <strong className="text-amber-400">Cấp {xp.level}</strong>
                          {' · '}{xp.totalXp} XP
                        </div>
                        {/* XP progress bar */}
                        <div className="mt-2 w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all"
                            style={{ width: `${xpProgress}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {xp.totalXp}/{nextLevelXp} XP đến cấp {xp.level + 1}
                        </div>
                        {/* Daily XP */}
                        <div className="text-[10px] text-slate-400 mt-1">
                          Hôm nay: <span className="text-cyan-400 font-bold">{xp.xpToday}/{xp.dailyCap} XP</span>
                          {xp.xpToday >= xp.dailyCap && <span className="text-amber-400 ml-1">(đã đạt giới hạn)</span>}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { onClose(); onOpenCustomizer(); }}
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition active:scale-95 cursor-pointer min-h-[44px]"
                >
                  <UserCog className="w-4 h-4" />
                  <span>Tùy chỉnh nhân vật</span>
                </button>
              </div>

              {/* STATS */}
              {xp && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Tuần này', value: `${xp.xpThisWeek} XP`, color: 'text-cyan-400' },
                    { label: 'Tuần trước', value: `${xp.xpLastWeek} XP`, color: 'text-slate-400' },
                    { label: 'Chuỗi ngày', value: `${xp.currentStreak} ngày`, color: 'text-amber-400' },
                    { label: 'Kỷ lục', value: `${xp.longestStreak} ngày`, color: 'text-emerald-400' },
                  ].map((s) => (
                    <div key={s.label} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-center">
                      <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* CLASS LEADERBOARD */}
              {leaderboard.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span>Bảng vinh danh lớp</span>
                  </div>
                  <div className="rounded-xl border border-amber-500/20 overflow-hidden">
                    {leaderboard.map((entry) => {
                      const isMe = entry.user_id === character.id;
                      const medalEmoji = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null;
                      return (
                        <div
                          key={entry.user_id}
                          className={`flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 last:border-b-0 ${
                            isMe ? 'bg-amber-950/30' : 'bg-slate-900/50'
                          }`}
                        >
                          <div className="w-8 text-center shrink-0">
                            {medalEmoji ? (
                              <span className="text-lg">{medalEmoji}</span>
                            ) : (
                              <span className="text-xs font-bold text-slate-500">#{entry.rank}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm font-semibold truncate block ${isMe ? 'text-amber-300' : 'text-white'}`}>
                              {entry.display_name || 'Học sinh'}
                              {isMe && <span className="text-[10px] text-amber-400 ml-1">(bạn)</span>}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-bold text-amber-400">Cấp {entry.level}</div>
                            <div className="text-[10px] text-slate-400">{entry.total_xp} XP</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* BADGES */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Huy hiệu ({unlockedCount}/{badges.length})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {badges.map((b) => (
                    <div
                      key={b.id}
                      className={`p-3.5 rounded-xl border flex items-center gap-3.5 transition ${
                        b.awarded
                          ? 'bg-amber-950/20 border-amber-600/50 shadow-md shadow-amber-950/30'
                          : 'bg-slate-900/50 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl shrink-0 border border-slate-700">
                        {b.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-white flex items-center justify-between">
                          <span className="truncate">{b.name}</span>
                          {b.awarded ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{b.description}</div>
                        {b.awarded && b.xp_reward > 0 && (
                          <div className="text-[10px] text-amber-400 mt-1">+{b.xp_reward} XP</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DialogFrame>
  );
};
