'use client';

/**
 * Trạng thái game của học sinh (nhân vật, tiến độ, điều hướng giữa các địa điểm).
 *
 * TẠM THỜI: dữ liệu vẫn lưu ở localStorage và XP được tính ở trình duyệt, đúng như
 * giao diện gốc từ AI Studio. Bước nối Supabase sẽ thay toàn bộ phần ghi XP/điểm/tiến độ
 * bằng Server Action/RPC (quy tắc bất biến 1, 5, 6). Không thêm logic chấm điểm mới vào đây.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  BuildingInfo,
  CharacterConfig,
  Direction,
  PlayerProgress,
  QuizQuestion,
} from '@/types/game';
import { INITIAL_PROGRESS, ProgressionSystem, QUEST_IDS } from '@/game/engine/progression';
import type { CityPlayerHandle } from '@/components/city/CityMapCanvas';
import { BUILDING_ROUTES, STUDENT_HOME } from '@/lib/student-routes';
import { sound } from '@/lib/audio';

const STORAGE_KEY_CHAR = 'eduverse_character_v2';
const STORAGE_KEY_PROGRESS = 'eduverse_progress_v2';
const STORAGE_KEY_FIRST_TIME = 'eduverse_first_time_v2';

// Học sinh giả cho giao diện. Sẽ thay bằng hồ sơ từ DB.
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

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function sameList(a: string[], b: string[]) {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

interface StudentGameContextValue {
  hydrated: boolean;
  character: CharacterConfig;
  progress: PlayerProgress;
  isFirstTime: boolean;
  isEditingCharacter: boolean;
  playerRef: React.MutableRefObject<CityPlayerHandle | null>;

  setEditingCharacter: (editing: boolean) => void;
  confirmCharacter: (config: CharacterConfig) => void;
  updatePosition: (pos: { x: number; y: number }, facing: Direction) => void;

  enterBuilding: (building: BuildingInfo) => void;
  fastTravel: (building: BuildingInfo) => void;
  directEnter: (building: BuildingInfo) => void;
  closeBuilding: () => void;

  completeQuestVisit: (questId: (typeof QUEST_IDS)[keyof typeof QUEST_IDS]) => void;
  completeLibraryLesson: (lessonId: string, xp: number, points: number) => void;
  finishQuiz: (score: number, xp: number, points: number) => void;
  recordMistake: (question: QuizQuestion, selectedIndex: number) => void;
  resolveMistake: (mistakeId: string, xp: number, points: number) => void;
  completeStemExperiment: (expId: string, xp: number, points: number) => void;
  claimQuest: (questId: string) => void;
}

const StudentGameContext = createContext<StudentGameContextValue | null>(null);

export function useStudentGame() {
  const ctx = useContext(StudentGameContext);
  if (!ctx) throw new Error('useStudentGame phải dùng bên trong <StudentGameProvider>');
  return ctx;
}

export function StudentGameProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [character, setCharacter] = useState<CharacterConfig>(DEFAULT_CHARACTER);
  const [progress, setProgress] = useState<PlayerProgress>(INITIAL_PROGRESS);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [isEditingCharacter, setEditingCharacter] = useState(false);
  const playerRef = useRef<CityPlayerHandle | null>(null);
  // true khi địa điểm được mở từ bản đồ trong phiên này → đóng bằng router.back()
  const openedFromCityRef = useRef(false);

  // Đọc localStorage sau khi mount (server không có localStorage → tránh lệch hydration)
  useEffect(() => {
    const savedChar = readJson<CharacterConfig>(STORAGE_KEY_CHAR);
    const savedProgress = readJson<PlayerProgress>(STORAGE_KEY_PROGRESS);
    if (savedChar) setCharacter(savedChar);
    if (savedProgress) setProgress(savedProgress);
    const autostart = new URLSearchParams(window.location.search).get('autostart') === '1';
    let firstTime = false;
    try {
      firstTime = !autostart && localStorage.getItem(STORAGE_KEY_FIRST_TIME) === null;
    } catch {}
    setIsFirstTime(firstTime);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeJson(STORAGE_KEY_CHAR, character);
  }, [character, hydrated]);

  useEffect(() => {
    if (hydrated) writeJson(STORAGE_KEY_PROGRESS, progress);
  }, [progress, hydrated]);

  // Đồng bộ trang phục mở khóa theo tiến độ (bản gốc thiếu dependency, đọc character cũ)
  useEffect(() => {
    if (!hydrated) return;
    setCharacter((prev) => {
      const next = ProgressionSystem.updateCharacterUnlockables(prev, progress);
      return sameList(next.unlockedOutfits, prev.unlockedOutfits) &&
        sameList(next.unlockedAccessories, prev.unlockedAccessories)
        ? prev
        : next;
    });
  }, [progress, hydrated]);

  const celebrate = useCallback(() => {
    playerRef.current?.triggerCelebration?.();
  }, []);

  const confirmCharacter = useCallback(
    (config: CharacterConfig) => {
      setCharacter(config);
      setIsFirstTime(false);
      setEditingCharacter(false);
      try {
        localStorage.setItem(STORAGE_KEY_FIRST_TIME, 'done');
      } catch {}
      sound.playSuccess();
      celebrate();
    },
    [celebrate]
  );

  // Phải ổn định (useCallback) vì vòng lặp canvas phụ thuộc vào nó
  const updatePosition = useCallback((pos: { x: number; y: number }, facing: Direction) => {
    setProgress((prev) => ({ ...prev, lastPosition: pos, lastFacing: facing }));
  }, []);

  const enterBuilding = useCallback(
    (building: BuildingInfo) => {
      const lockCheck = ProgressionSystem.isBuildingUnlocked(building.id, progress);
      if (!lockCheck.unlocked) {
        sound.playError();
        return;
      }
      sound.playInteract();
      openedFromCityRef.current = true;
      router.push(BUILDING_ROUTES[building.id], { scroll: false });
    },
    [progress, router]
  );

  const fastTravel = useCallback((building: BuildingInfo) => {
    playerRef.current?.teleportTo(building.entrance.x, building.entrance.y, 'down');
  }, []);

  const directEnter = useCallback(
    (building: BuildingInfo) => {
      fastTravel(building);
      enterBuilding(building);
    },
    [fastTravel, enterBuilding]
  );

  const closeBuilding = useCallback(() => {
    if (openedFromCityRef.current) {
      openedFromCityRef.current = false;
      router.back();
    } else {
      router.replace(STUDENT_HOME, { scroll: false });
    }
  }, [router]);

  const completeQuestVisit = useCallback(
    (questId: (typeof QUEST_IDS)[keyof typeof QUEST_IDS]) => {
      setProgress((prev) => ProgressionSystem.completeQuest(prev, questId));
    },
    []
  );

  const completeLibraryLesson = useCallback(
    (_lessonId: string, xp: number, points: number) => {
      setProgress((prev) => {
        const res = ProgressionSystem.addXP(prev, xp, points);
        return ProgressionSystem.completeQuest(res.updatedProgress, QUEST_IDS.readTheory);
      });
      celebrate();
    },
    [celebrate]
  );

  const finishQuiz = useCallback(
    (score: number, xp: number, points: number) => {
      setProgress((prev) => {
        const res = ProgressionSystem.addXP(prev, xp, points);
        const unlocked = new Set(res.updatedProgress.unlockedBuildings);
        unlocked.add('stem_lab');
        unlocked.add('review_station');
        return ProgressionSystem.completeQuest(
          {
            ...res.updatedProgress,
            quizzesCompleted: prev.quizzesCompleted + 1,
            highScore: Math.max(prev.highScore, score),
            unlockedBuildings: Array.from(unlocked),
          },
          QUEST_IDS.quizBattle
        );
      });
      celebrate();
    },
    [celebrate]
  );

  const recordMistake = useCallback((question: QuizQuestion, selectedIndex: number) => {
    setProgress((prev) => {
      if (prev.mistakes.some((m) => m.question.id === question.id)) return prev;
      const unlocked = new Set(prev.unlockedBuildings);
      unlocked.add('review_station');
      return {
        ...prev,
        mistakes: [
          {
            id: `mistake_${Date.now()}_${question.id}`,
            question,
            userSelectedIndex: selectedIndex,
            timestamp: Date.now(),
            reviewed: false,
          },
          ...prev.mistakes,
        ],
        unlockedBuildings: Array.from(unlocked),
      };
    });
  }, []);

  const resolveMistake = useCallback(
    (mistakeId: string, xp: number, points: number) => {
      setProgress((prev) => {
        const res = ProgressionSystem.addXP(prev, xp, points);
        return {
          ...res.updatedProgress,
          mistakes: res.updatedProgress.mistakes.map((m) =>
            m.id === mistakeId ? { ...m, reviewed: true } : m
          ),
        };
      });
      celebrate();
    },
    [celebrate]
  );

  const completeStemExperiment = useCallback(
    (expId: string, xp: number, points: number) => {
      setProgress((prev) => {
        const res = ProgressionSystem.addXP(prev, xp, points);
        const exps = new Set(res.updatedProgress.experimentsCompleted);
        exps.add(expId);
        return ProgressionSystem.completeQuest(
          { ...res.updatedProgress, experimentsCompleted: Array.from(exps) },
          QUEST_IDS.stemExperiment
        );
      });
      celebrate();
    },
    [celebrate]
  );

  const claimQuest = useCallback(
    (questId: string) => {
      const current = progress.quests.find((q) => q.id === questId);
      if (!current || current.claimed || !current.completed) return;
      setProgress((prev) => {
        const quest = prev.quests.find((q) => q.id === questId);
        if (!quest || quest.claimed || !quest.completed) return prev;
        const res = ProgressionSystem.addXP(prev, quest.rewardXP, quest.rewardPoints);
        return {
          ...res.updatedProgress,
          quests: res.updatedProgress.quests.map((q) =>
            q.id === questId ? { ...q, claimed: true } : q
          ),
        };
      });
      sound.playSuccess();
      celebrate();
    },
    [progress, celebrate]
  );

  const value = useMemo<StudentGameContextValue>(
    () => ({
      hydrated,
      character,
      progress,
      isFirstTime,
      isEditingCharacter,
      playerRef,
      setEditingCharacter,
      confirmCharacter,
      updatePosition,
      enterBuilding,
      fastTravel,
      directEnter,
      closeBuilding,
      completeQuestVisit,
      completeLibraryLesson,
      finishQuiz,
      recordMistake,
      resolveMistake,
      completeStemExperiment,
      claimQuest,
    }),
    [
      hydrated,
      character,
      progress,
      isFirstTime,
      isEditingCharacter,
      confirmCharacter,
      updatePosition,
      enterBuilding,
      fastTravel,
      directEnter,
      closeBuilding,
      completeQuestVisit,
      completeLibraryLesson,
      finishQuiz,
      recordMistake,
      resolveMistake,
      completeStemExperiment,
      claimQuest,
    ]
  );

  return <StudentGameContext.Provider value={value}>{children}</StudentGameContext.Provider>;
}
