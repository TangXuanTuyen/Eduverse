'use client';

import React from 'react';
import type { BuildingId, BuildingInfo, PlayerProgress } from '@/types/game';
import { BUILDINGS } from '@/game/engine/cityData';
import { ProgressionSystem } from '@/game/engine/progression';
import type { BuildingNotification } from '@/game/config/town-map';
import { Lock, ArrowRight, Bell } from 'lucide-react';

interface CityListViewProps {
  progress: PlayerProgress;
  notifications: Record<BuildingId, BuildingNotification[]>;
  onEnter: (building: BuildingInfo) => void;
}

export function CityListView({ progress, notifications, onEnter }: CityListViewProps) {
  return (
    <div className="absolute inset-0 bg-slate-950 overflow-y-auto p-4 pb-20">
      <h2 className="text-base font-bold text-white mb-4">Khu Vực Học Tập</h2>
      <div className="space-y-3 max-w-lg mx-auto">
        {Object.values(BUILDINGS).map((b) => {
          const status = ProgressionSystem.isBuildingUnlocked(b.id, progress);
          const notifs = notifications[b.id];
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => status.unlocked && onEnter(b)}
              disabled={!status.unlocked}
              className={`w-full p-4 rounded-xl border text-left flex items-center gap-3 transition min-h-[56px] ${
                status.unlocked
                  ? 'bg-slate-800/80 border-slate-700 hover:border-indigo-500/50 cursor-pointer active:scale-[0.98]'
                  : 'bg-slate-900/60 border-slate-800 opacity-60 cursor-not-allowed'
              }`}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: b.color }}
              >
                {b.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  {b.vietnameseName}
                  {!status.unlocked && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                  {notifs && notifs.length > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded-full font-semibold">
                      <Bell className="w-3 h-3" />
                      {notifs[0].label}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 truncate">{b.description}</div>
                {!status.unlocked && status.reason && (
                  <div className="text-[11px] text-amber-400 mt-1 font-medium">{status.reason}</div>
                )}
              </div>
              {status.unlocked && (
                <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
