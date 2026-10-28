'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import type { BuildingInfo } from '@/types/game';
import { CityHUD } from '@/components/city/CityHUD';
import { CityListView } from '@/components/city/CityListView';
import { PlayerController } from '@/components/city/PlayerController';
import { EmoteBar } from '@/components/city/EmoteBar';
import { CharacterSelection } from '@/components/character/CharacterSelection';
import { useStudentGame } from '@/components/student/StudentGameProvider';
import { usePresence } from '@/lib/hooks/usePresence';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useListMode } from '@/lib/hooks/useListMode';
import { useBuildingNotifications } from '@/lib/hooks/useBuildingNotifications';
import { STUDENT_HOME, GUEST_HOME } from '@/lib/student-routes';
import { PRESENCE_BROADCAST_INTERVAL_MS } from '@/game/config/town-map';
import Link from 'next/link';
import { BreakReminder } from '@/components/ui/BreakReminder';
import { LanguageSwitch } from '@/components/i18n/LanguageSwitch';
import { useLocale } from '@/components/i18n/LocaleProvider';

const AoDaiCompanion = dynamic(
  () => import('@/components/companion/AoDaiCompanion').then((m) => m.AoDaiCompanion),
  { ssr: false }
);

// Engine bản đồ nặng (~2.700 dòng canvas) → tải lười, chỉ chạy trên trình duyệt
const CityMapCanvas = dynamic(
  () => import('@/components/city/CityMapCanvas').then((m) => m.CityMapCanvas),
  { ssr: false, loading: () => <CityLoading /> }
);

function CityLoading() {
  const { t } = useLocale();
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-950 text-slate-300" role="status">
      <span className="text-sm">{t('city.loading')}</span>
    </div>
  );
}

/**
 * Bản đồ thành phố luôn nằm dưới cùng; các địa điểm (children) là route con
 * hiển thị dạng hộp thoại phía trên. Bản đồ tạm dừng khi có hộp thoại mở.
 */
export function CityShell({ children }: { children: React.ReactNode }) {
  const game = useStudentGame();
  const { t } = useLocale();
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const { listMode, toggleListMode } = useListMode();
  const notifications = useBuildingNotifications(game.character.id || undefined);
  const [nearbyBuilding, setNearbyBuilding] = useState<BuildingInfo | null>(null);
  const [fastTravelOpen, setFastTravelOpen] = useState(false);

  const homeUrl = game.isGuest ? GUEST_HOME : STUDENT_HOME;
  const placeOpen = pathname !== homeUrl;
  const paused = placeOpen || game.isFirstTime || game.isEditingCharacter;

  // Multiplayer presence
  const { peers, broadcast, broadcastLeave } = usePresence(
    game.isGuest ? null : game.roomId,
    game.isGuest ? null : game.character.id || null,
    false,
  );

  // Broadcast vị trí định kỳ
  const broadcastRef = useRef(broadcast);
  broadcastRef.current = broadcast;
  const lastBroadcastRef = useRef(0);

  const handlePositionChange = useCallback(
    (pos: { x: number; y: number }, facing: string) => {
      game.updatePosition(pos, facing as 'up' | 'down' | 'left' | 'right');
      const now = Date.now();
      if (now - lastBroadcastRef.current < PRESENCE_BROADCAST_INTERVAL_MS) return;
      lastBroadcastRef.current = now;
      const c = game.character;
      broadcastRef.current({
        userId: c.id,
        displayName: c.name,
        x: pos.x,
        y: pos.y,
        facing,
        outfit: c.outfit,
        skinTone: c.skinTone,
        hairStyle: c.hairStyle,
        hairColor: c.hairColor,
      });
    },
    [game],
  );

  // Broadcast leave khi unmount
  useEffect(() => () => broadcastLeave(), [broadcastLeave]);

  // Emote: hiện nổi trên đầu nhân vật (tự mình), sẽ mở rộng broadcast sau
  const handleEmote = useCallback(
    (emote: string) => {
      // TODO: broadcast emote to peers via channel
      void emote;
    },
    [],
  );

  const handlePhrase = useCallback(
    (phrase: string) => {
      void phrase;
    },
    [],
  );

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
                  peers={peers}
                  onEnterBuilding={game.enterBuilding}
                  onPositionChange={handlePositionChange}
                  onRequestEditCharacter={() => game.setEditingCharacter(true)}
                  onNearbyBuildingChange={setNearbyBuilding}
                  paused={paused}
                  reducedMotion={reducedMotion}
                  playerRefExternal={game.playerRef}
                />

                {!game.isGuest && !paused && (
                  <EmoteBar
                    onEmote={handleEmote}
                    onPhrase={handlePhrase}
                    onReport={() => {}}
                    disabled={paused}
                  />
                )}

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

          <div className="absolute top-3 right-3 z-40">
            <LanguageSwitch />
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
          {!game.isGuest && <AoDaiCompanion />}

          {/* Guest banner */}
          {game.isGuest && (
            <div className="absolute bottom-3 left-3 right-3 z-40 pointer-events-none flex justify-center">
              <div className="pointer-events-auto bg-amber-900/90 border border-amber-600/50 backdrop-blur-md rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-3 max-w-lg">
                <span className="text-sm text-amber-100">
                  {t('city.guest.banner')}
                </span>
                <Link
                  href="/login"
                  className="shrink-0 px-3 py-1.5 bg-white/90 hover:bg-white text-slate-900 rounded-lg text-xs font-bold transition min-h-[36px] flex items-center"
                >
                  {t('city.guest.login')}
                </Link>
              </div>
            </div>
          )}

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
