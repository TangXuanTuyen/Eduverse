/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  BuildingId,
  CharacterConfig,
  PlayerProgress,
  Quest,
} from '@/types/game';

/** Id nhiệm vụ dùng chung giữa dữ liệu và logic — tránh gõ sai chuỗi (lỗi cũ: 'q_enroll'). */
export const QUEST_IDS = {
  schoolWelcome: 'q_school_welcome',
  readTheory: 'q_read_theory',
  quizBattle: 'q_quiz_battle',
  stemExperiment: 'q_stem_experiment',
} as const;

export type QuestId = (typeof QUEST_IDS)[keyof typeof QUEST_IDS];

export const INITIAL_QUESTS: Quest[] = [
  {
    id: QUEST_IDS.schoolWelcome,
    title: 'Đăng ký nhập học EDUVERSE',
    description: 'Khám phá trường học và nhận thời khóa biểu môn Khoa học tự nhiên.',
    locationId: 'school',
    targetCount: 1,
    currentCount: 0,
    rewardXP: 60,
    rewardPoints: 50,
    completed: false,
    claimed: false,
  },
  {
    id: QUEST_IDS.readTheory,
    title: 'Tri thức là sức mạnh',
    description: 'Đến Thư viện Tri thức và hoàn thành 1 bài đọc lý thuyết KHTN.',
    locationId: 'library',
    targetCount: 1,
    currentCount: 0,
    rewardXP: 100,
    rewardPoints: 80,
    completed: false,
    claimed: false,
  },
  {
    id: QUEST_IDS.quizBattle,
    title: 'Thử thách Đấu trường',
    description: 'Chơi 1 ván trắc nghiệm kiến thức nhanh tại Quiz Arcade.',
    locationId: 'quiz_arcade',
    targetCount: 1,
    currentCount: 0,
    rewardXP: 120,
    rewardPoints: 100,
    completed: false,
    claimed: false,
  },
  {
    id: QUEST_IDS.stemExperiment,
    title: 'Nhà sáng chế tương lai',
    description: 'Thực hiện 1 thí nghiệm thực hành tại STEM Lab.',
    locationId: 'stem_lab',
    targetCount: 1,
    currentCount: 0,
    rewardXP: 150,
    rewardPoints: 120,
    completed: false,
    claimed: false,
  },
];

export const INITIAL_PROGRESS: PlayerProgress = {
  level: 1,
  eduPoints: 100,
  currentXP: 0,
  nextLevelXP: 150,
  quizzesCompleted: 0,
  highScore: 0,
  experimentsCompleted: [],
  unlockedBuildings: ['library', 'quiz_arcade', 'school', 'achievement_plaza', 'virtual_lab', 'world_3d'],
  mistakes: [],
  quests: INITIAL_QUESTS,
  lastPosition: { x: 18.5, y: 7.5 }, // In front of the School
  lastFacing: 'down',
};

export class ProgressionSystem {
  static getXpRequiredForLevel(level: number): number {
    return level * 150;
  }

  static isBuildingUnlocked(
    buildingId: BuildingId,
    progress: PlayerProgress
  ): { unlocked: boolean; reason?: string } {
    if (progress.unlockedBuildings.includes(buildingId)) {
      return { unlocked: true };
    }

    if (buildingId === 'stem_lab') {
      const unlocked = progress.quizzesCompleted >= 1 || progress.level >= 2;
      return {
        unlocked,
        reason: unlocked
          ? undefined
          : 'Khóa: Cần hoàn thành 1 trận Quiz Arcade hoặc đạt Cấp 2 để mở STEM Lab!',
      };
    }

    if (buildingId === 'review_station') {
      const hasErrors = progress.mistakes.length > 0;
      const unlocked = hasErrors || progress.quizzesCompleted >= 1;
      return {
        unlocked,
        reason: unlocked
          ? undefined
          : 'Khóa: Mở khi bạn có câu sai cần củng cố tại Quiz Arcade hoặc hoàn thành bài thi!',
      };
    }

    return { unlocked: true };
  }

  /** Đánh dấu một nhiệm vụ đã hoàn thành (idempotent). */
  static completeQuest(progress: PlayerProgress, questId: QuestId): PlayerProgress {
    let changed = false;
    const quests = progress.quests.map((q) => {
      if (q.id !== questId || q.completed) return q;
      changed = true;
      return { ...q, currentCount: q.targetCount, completed: true };
    });
    return changed ? { ...progress, quests } : progress;
  }

  static addXP(
    progress: PlayerProgress,
    xpToAdd: number,
    pointsToAdd = 0
  ): {
    updatedProgress: PlayerProgress;
    didLevelUp: boolean;
    unlockedItems: string[];
  } {
    let currentXP = progress.currentXP + xpToAdd;
    let level = progress.level;
    let nextLevelXP = progress.nextLevelXP;
    let didLevelUp = false;

    while (currentXP >= nextLevelXP) {
      currentXP -= nextLevelXP;
      level += 1;
      nextLevelXP = this.getXpRequiredForLevel(level);
      didLevelUp = true;
    }

    const updatedUnlockedBuildings = [...progress.unlockedBuildings];
    if (level >= 2 && !updatedUnlockedBuildings.includes('stem_lab')) {
      updatedUnlockedBuildings.push('stem_lab');
    }
    if (!updatedUnlockedBuildings.includes('review_station')) {
      updatedUnlockedBuildings.push('review_station');
    }

    const updatedProgress: PlayerProgress = {
      ...progress,
      level,
      currentXP,
      nextLevelXP,
      eduPoints: progress.eduPoints + pointsToAdd,
      unlockedBuildings: updatedUnlockedBuildings,
    };

    const unlockedItems = this.checkNewlyUnlockedItems(updatedProgress);

    return {
      updatedProgress,
      didLevelUp,
      unlockedItems,
    };
  }

  static checkNewlyUnlockedItems(progress: PlayerProgress): string[] {
    const items: string[] = [];
    if (progress.level >= 2) {
      items.push('hoodie');
    }
    if (progress.level >= 3) {
      items.push('backpack');
    }
    if (progress.quizzesCompleted >= 1) {
      items.push('vr_headset');
    }
    if (progress.experimentsCompleted.length >= 1) {
      items.push('stem_coat');
    }
    if (progress.mistakes.some((m) => m.reviewed)) {
      items.push('science_badge');
    }
    return items;
  }

  static updateCharacterUnlockables(
    char: CharacterConfig,
    progress: PlayerProgress
  ): CharacterConfig {
    const unlockedOutfits = new Set(char.unlockedOutfits || ['thcs_uniform']);
    const unlockedAccessories = new Set(char.unlockedAccessories || ['none']);

    unlockedOutfits.add('thcs_uniform');
    unlockedOutfits.add('sport');

    if (progress.level >= 2) unlockedOutfits.add('hoodie');
    if (progress.experimentsCompleted.length >= 1) unlockedOutfits.add('stem_coat');
    if (progress.level >= 4) unlockedOutfits.add('astronaut');

    if (progress.quizzesCompleted >= 1) unlockedAccessories.add('vr_headset');
    if (progress.level >= 3) unlockedAccessories.add('backpack');
    if (progress.mistakes.some((m) => m.reviewed)) unlockedAccessories.add('science_badge');
    unlockedAccessories.add('glasses');
    unlockedAccessories.add('headphones');
    unlockedAccessories.add('cap');

    return {
      ...char,
      unlockedOutfits: Array.from(unlockedOutfits),
      unlockedAccessories: Array.from(unlockedAccessories),
    };
  }
}
