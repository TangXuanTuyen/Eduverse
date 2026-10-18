/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BuildingId,
  BuildingInfo,
  CharacterConfig,
  Direction,
  PlayerProgress,
  QuizQuestion,
} from './types/game.ts';
import { BUILDINGS } from './engine/cityData.ts';
import { INITIAL_PROGRESS, ProgressionSystem } from './engine/progression.ts';
import { CharacterSelection } from './components/character/CharacterSelection.tsx';
import { CityMapCanvas } from './components/city/CityMapCanvas.tsx';
import { CityHUD } from './components/city/CityHUD.tsx';
import { PlayerController } from './components/city/PlayerController.tsx';
import { LibraryModal } from './components/learning/LibraryModal.tsx';
import { QuizArcadeModal } from './components/learning/QuizArcadeModal.tsx';
import { ReviewStationModal } from './components/learning/ReviewStationModal.tsx';
import { StemLabModal } from './components/learning/StemLabModal.tsx';
import { SchoolModal } from './components/learning/SchoolModal.tsx';
import { AchievementPlazaModal } from './components/learning/AchievementPlazaModal.tsx';
import { sound } from './utils/audio.ts';

const STORAGE_KEY_CHAR = 'eduverse_character_v2';
const STORAGE_KEY_PROGRESS = 'eduverse_progress_v2';
const STORAGE_KEY_FIRST_TIME = 'eduverse_first_time_v2';

const DEFAULT_CHARACTER: CharacterConfig = {
  id: 'student_1',
  name: 'Nguyễn Minh Khang',
  className: 'Lớp 7A1',
  gender: 'boy',
  skinTone: '#FCD34D',
  hairStyle: 'short_classic',
  hairColor: '#1E293B',
  eyeColor: '#0F172A',
  outfit: 'thcs_uniform',
  outfitColor: '#2563EB',
  accessory: 'glasses',
  unlockedOutfits: ['thcs_uniform', 'sport'],
  unlockedAccessories: ['none', 'glasses', 'headphones', 'cap'],
};

export default function App() {
  // Load saved character or default
  const [character, setCharacter] = useState<CharacterConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHAR);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_CHARACTER;
  });

  // Load saved progression or default
  const [progress, setProgress] = useState<PlayerProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROGRESS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_PROGRESS;
  });

  // First time character creation check (shows creation screen first unless autostart is requested)
  const [isFirstTime, setIsFirstTime] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('autostart') === '1') return false;
      return localStorage.getItem(STORAGE_KEY_FIRST_TIME) === null;
    }
    return false;
  });

  const [isEditingCharacter, setIsEditingCharacter] = useState(false);
  const [activeBuilding, setActiveBuilding] = useState<BuildingInfo | null>(null);

  // Player canvas controller ref
  const playerRef = useRef<{
    teleportTo: (x: number, y: number, facing?: Direction) => void;
    moveByInput: (dx: number, dy: number) => void;
    triggerCelebration?: () => void;
  } | null>(null);

  // Persist state to localStorage on updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHAR, JSON.stringify(character));
    } catch {}
  }, [character]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
    } catch {}
  }, [progress]);

  // Sync unlockables whenever progress changes
  useEffect(() => {
    const updatedChar = ProgressionSystem.updateCharacterUnlockables(character, progress);
    setCharacter(updatedChar);
  }, [progress.level, progress.quizzesCompleted, progress.experimentsCompleted.length, progress.mistakes.length]);

  // Handle Character Creation / Confirmation
  const handleConfirmCharacter = (newConfig: CharacterConfig) => {
    setCharacter(newConfig);
    setIsFirstTime(false);
    setIsEditingCharacter(false);
    localStorage.setItem(STORAGE_KEY_FIRST_TIME, 'done');
    sound.playSuccess();
    playerRef.current?.triggerCelebration?.();
  };

  // Position updates from canvas
  const handlePositionChange = useCallback((pos: { x: number; y: number }, facing: Direction) => {
    setProgress((prev) => ({
      ...prev,
      lastPosition: pos,
      lastFacing: facing,
    }));
  }, []);

  // Enter building handler
  const handleEnterBuilding = (building: BuildingInfo) => {
    const lockCheck = ProgressionSystem.isBuildingUnlocked(building.id, progress);
    if (!lockCheck.unlocked) {
      sound.playError();
      return;
    }
    sound.playInteract();

    // Visiting the school fulfills the enrollment mission
    if (building.id === 'school') {
      setProgress((prev) => ({
        ...prev,
        quests: prev.quests.map((q) =>
          q.id === 'q_enroll' ? { ...q, currentCount: 1, completed: true } : q
        ),
      }));
    }

    setActiveBuilding(building);
  };

  // Fast Travel handler: moves player to entrance of selected building
  const handleFastTravel = (b: BuildingInfo) => {
    if (playerRef.current) {
      playerRef.current.teleportTo(b.entrance.x, b.entrance.y, 'down');
    }
  };

  // Direct entry from menu
  const handleDirectEnter = (b: BuildingInfo) => {
    handleFastTravel(b);
    handleEnterBuilding(b);
  };

  // Learning interactions: Library completion
  const handleCompleteLibraryLesson = (lessonId: string, xp: number, points: number) => {
    const res = ProgressionSystem.addXP(progress, xp, points);
    const updatedQuests = res.updatedProgress.quests.map((q) => {
      if (q.id === 'q_read_theory') {
        return { ...q, currentCount: 1, completed: true };
      }
      return q;
    });

    setProgress({
      ...res.updatedProgress,
      quests: updatedQuests,
    });
    playerRef.current?.triggerCelebration?.();
  };

  // Learning interactions: Quiz Arcade completion
  const handleFinishQuiz = (score: number, xp: number, points: number) => {
    const res = ProgressionSystem.addXP(progress, xp, points);
    const updatedQuests = res.updatedProgress.quests.map((q) => {
      if (q.id === 'q_quiz_battle') {
        return { ...q, currentCount: 1, completed: true };
      }
      return q;
    });

    // Automatically unlock STEM Lab on quiz completion
    const unlocked = new Set(res.updatedProgress.unlockedBuildings);
    unlocked.add('stem_lab');
    unlocked.add('review_station');

    setProgress({
      ...res.updatedProgress,
      quizzesCompleted: progress.quizzesCompleted + 1,
      highScore: Math.max(progress.highScore, score),
      unlockedBuildings: Array.from(unlocked),
      quests: updatedQuests,
    });
    playerRef.current?.triggerCelebration?.();
  };

  // Learning interactions: Recording Quiz mistakes for Review Station
  const handleRecordMistake = (question: QuizQuestion, selectedIndex: number) => {
    setProgress((prev) => {
      // Avoid duplicate mistakes in list
      const exists = prev.mistakes.some((m) => m.question.id === question.id);
      if (exists) return prev;

      const newMistake = {
        id: `mistake_${Date.now()}_${question.id}`,
        question,
        userSelectedIndex: selectedIndex,
        timestamp: Date.now(),
        reviewed: false,
      };

      const unlocked = new Set(prev.unlockedBuildings);
      unlocked.add('review_station');

      return {
        ...prev,
        mistakes: [newMistake, ...prev.mistakes],
        unlockedBuildings: Array.from(unlocked),
      };
    });
  };

  // Learning interactions: Review Station resolution
  const handleResolveMistake = (mistakeId: string, xp: number, points: number) => {
    const res = ProgressionSystem.addXP(progress, xp, points);
    const updatedMistakes = res.updatedProgress.mistakes.map((m) => {
      if (m.id === mistakeId) {
        return { ...m, reviewed: true };
      }
      return m;
    });

    setProgress({
      ...res.updatedProgress,
      mistakes: updatedMistakes,
    });
    playerRef.current?.triggerCelebration?.();
  };

  // Learning interactions: STEM Lab experiment completion
  const handleCompleteStemExperiment = (expId: string, xp: number, points: number) => {
    const res = ProgressionSystem.addXP(progress, xp, points);
    const updatedQuests = res.updatedProgress.quests.map((q) => {
      if (q.id === 'q_stem_experiment') {
        return { ...q, currentCount: 1, completed: true };
      }
      return q;
    });

    const exps = new Set(res.updatedProgress.experimentsCompleted);
    exps.add(expId);

    setProgress({
      ...res.updatedProgress,
      experimentsCompleted: Array.from(exps),
      quests: updatedQuests,
    });
    playerRef.current?.triggerCelebration?.();
  };

  // School quests: Claiming rewards
  const handleClaimQuest = (questId: string) => {
    const quest = progress.quests.find((q) => q.id === questId);
    if (!quest || quest.claimed) return;

    const res = ProgressionSystem.addXP(progress, quest.rewardXP, quest.rewardPoints);
    const updatedQuests = res.updatedProgress.quests.map((q) => {
      if (q.id === questId) {
        return { ...q, claimed: true };
      }
      return q;
    });

    setProgress({
      ...res.updatedProgress,
      quests: updatedQuests,
    });
    sound.playSuccess();
    playerRef.current?.triggerCelebration?.();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* 1. INITIAL CHARACTER CREATION (Shown on First Login) */}
      {isFirstTime && (
        <CharacterSelection
          initialConfig={character}
          progress={progress}
          onConfirm={handleConfirmCharacter}
        />
      )}

      {/* 2. CHARACTER EDIT DRAWER (When student clicks "Chỉnh sửa nhân vật") */}
      {isEditingCharacter && (
        <CharacterSelection
          initialConfig={character}
          progress={progress}
          isEditing={true}
          onConfirm={handleConfirmCharacter}
          onCancel={() => setIsEditingCharacter(false)}
        />
      )}

      {/* 3. 2D CITY MAP CANVAS (Smooth camera, real movement, collisions, pathfinding) */}
      <CityMapCanvas
        character={character}
        progress={progress}
        onEnterBuilding={handleEnterBuilding}
        onPositionChange={handlePositionChange}
        onRequestEditCharacter={() => setIsEditingCharacter(true)}
        playerRefExternal={playerRef}
      />

      {/* 4. CITY HUD (Avatar, Level, XP bar, Zone directory, Quest list, Mute) */}
      <CityHUD
        character={character}
        progress={progress}
        onEditCharacter={() => setIsEditingCharacter(true)}
        onFastTravel={handleFastTravel}
        onDirectEnter={handleDirectEnter}
        onClaimQuestReward={handleClaimQuest}
      />

      {/* 5. VIRTUAL TOUCH D-PAD & CONTROLLER */}
      <PlayerController
        onMoveInput={(dx, dy) => playerRef.current?.moveByInput(dx, dy)}
        onInteract={() => {
          // If in proximity, enter
          const pos = progress.lastPosition || { x: 18.5, y: 7.5 };
          const nearby = Object.values(BUILDINGS).find(
            (b) => Math.hypot(pos.x - b.entrance.x, pos.y - b.entrance.y) <= 2.2
          );
          if (nearby) handleEnterBuilding(nearby);
        }}
        onOpenQuickTravel={() => {
          // Fast travel trigger handled via HUD
          const fastTravelBtn = document.querySelector('button[aria-label="Mở danh sách khu vực thành phố"]') as HTMLButtonElement | null;
          fastTravelBtn?.click();
        }}
        hasNearbyBuilding={false}
      />

      {/* 6. EDUCATIONAL LEARNING ACTIVITY MODALS */}
      {activeBuilding?.id === 'library' && (
        <LibraryModal
          onClose={() => setActiveBuilding(null)}
          onCompleteLesson={handleCompleteLibraryLesson}
        />
      )}

      {activeBuilding?.id === 'quiz_arcade' && (
        <QuizArcadeModal
          onClose={() => setActiveBuilding(null)}
          onFinishQuiz={handleFinishQuiz}
          onRecordMistake={handleRecordMistake}
        />
      )}

      {activeBuilding?.id === 'review_station' && (
        <ReviewStationModal
          mistakes={progress.mistakes}
          onClose={() => setActiveBuilding(null)}
          onResolveMistake={handleResolveMistake}
        />
      )}

      {activeBuilding?.id === 'stem_lab' && (
        <StemLabModal
          onClose={() => setActiveBuilding(null)}
          onCompleteExperiment={handleCompleteStemExperiment}
        />
      )}

      {activeBuilding?.id === 'school' && (
        <SchoolModal
          progress={progress}
          onClose={() => setActiveBuilding(null)}
          onClaimQuest={handleClaimQuest}
        />
      )}

      {activeBuilding?.id === 'achievement_plaza' && (
        <AchievementPlazaModal
          character={character}
          progress={progress}
          onClose={() => setActiveBuilding(null)}
          onOpenCustomizer={() => setIsEditingCharacter(true)}
        />
      )}
    </div>
  );
}
