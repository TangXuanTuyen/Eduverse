'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import type { BuildingInfo } from '@/types/game';
import { CityHUD } from '@/components/city/CityHUD';
import { CityListView } from '@/components/city/CityListView';
import { PlayerController } from '@/components/city/PlayerController';
import { CharacterSelection } from '@/components/character/CharacterSelection';
import { useStudentGame } from '@/components/student/StudentGameProvider';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useListMode } from '@/lib/hooks/useListMode';
import { useBuildingNotifications } from '@/lib/hooks/useBuildingNotifications';
import { STUDENT_HOME } from '@/lib/student-routes';
import { BreakReminder } from '@/components/ui/BreakReminder';

// Engine bản đồ nặng (~2.700 dòng canvas) → tải lười, chỉ chạy trên trình duyệt
const CityMapCanvas = dynamic(
  () => import('@/components/city/CityMapCanvas').then((m) => m.CityMapCanvas),
  { ssr: false, loading: () => <CityLoading /> }
);

function CityLoading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-950 text-slate-300" role="status">
      <span className="text-sm">Đang mở thành phố…</span>
    </div>
  );
}

/**
 * Bản đồ thành phố luôn nằm dưới cùng; các địa điểm (children) là route con
 * hiển thị dạng hộp thoại phía trên. Bản đồ tạm dừng khi có hộp thoại mở.
 */
export function CityShell({ children }: { children: React.ReactNode }) {
  const game = useStudentGame();
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const { listMode, toggleListMode } = useListMode();
  const notifications = useBuildingNotifications(game.character.id || undefined);
  const [nearbyBuilding, setNearbyBuilding] = useState<BuildingInfo | null>(null);
  const [fastTravelOpen, setFastTravelOpen] = useState(false);

  const placeOpen = pathname !== STUDENT_HOME;
  const paused = placeOpen || game.isFirstTime || game.isEditingCharacter;

  return (
    <main className="relative w-full h-dvh overflow-hidden bg-slate-950 font-sans">
      {!game.hydrated ? (
        <CityLoading />
      ) : (
        <>
          {/* Ẩn bản đồ khỏi trình đọc màn hình khi có hộp thoại phía trên */}
          <div className="absolute inset-0" aria-hidden={placeOpen || undefined} inert={placeOpen || undefined}>
            {listMode ? (
              <CityListView
                progress={game.progress}
                notifications={notifications}
                onEnter={game.enterBuilding}
              />
            ) : (
              <>
                <CityMapCanvas
                  character={game.character}
                  progress={game.progress}
                  onEnterBuilding={game.enterBuilding}
                  onPositionChange={game.updatePosition}
                  onRequestEditCharacter={() => game.setEditingCharacter(true)}
                  onNearbyBuildingChange={setNearbyBuilding}
                  paused={paused}
                  reducedMotion={reducedMotion}
                  playerRefExternal={game.playerRef}
                />

                <PlayerController
                  onMoveInput={(dx, dy) => game.playerRef.current?.moveByInput(dx, dy)}
                  onInteract={() => game.playerRef.current?.interact()}
                  onOpenQuickTravel={() => setFastTravelOpen(true)}
                  hasNearbyBuilding={nearbyBuilding !== null}
                />
              </>
            )}

            <CityHUD
              character={game.character}
              progress={game.progress}
              onEditCharacter={() => game.setEditingCharacter(true)}
              onFastTravel={game.fastTravel}
              onDirectEnter={game.directEnter}
              onClaimQuestReward={game.claimQuest}
              fastTravelOpen={fastTravelOpen}
              onFastTravelOpenChange={setFastTravelOpen}
              listMode={listMode}
              onToggleListMode={toggleListMode}
              notifications={notifications}
            />
          </div>

          {children}

          {/* Sau children để hộp thoại nhân vật nằm trên hộp thoại địa điểm */}
          {game.isFirstTime && (
            <CharacterSelection
              initialConfig={game.character}
              progress={game.progress}
              onConfirm={game.confirmCharacter}
            />
          )}

          <BreakReminder />

          {game.isEditingCharacter && (
            <CharacterSelection
              initialConfig={game.character}
              progress={game.progress}
              isEditing
              onConfirm={game.confirmCharacter}
              onCancel={() => game.setEditingCharacter(false)}
            />
          )}
        </>
      )}
    </main>
  );
}
