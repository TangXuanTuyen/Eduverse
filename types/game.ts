/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CharacterConfig {
  id: string;
  name: string;
  className: string; // e.g. "Lớp 7A1"
  gender: 'boy' | 'girl' | 'neutral';
  skinTone: string; // hex color or preset key
  hairStyle: string; // 'short_classic' | 'spiky' | 'ponytail' | 'bob' | 'curly' | 'wavy'
  hairColor: string; // hex color
  eyeColor: string; // hex color
  outfit: string; // 'thcs_uniform' | 'stem_coat' | 'hoodie' | 'astronaut' | 'sport'
  outfitColor: string; // primary outfit color
  accessory: string; // 'none' | 'glasses' | 'headphones' | 'backpack' | 'cap' | 'science_badge' | 'vr_headset'
  unlockedOutfits: string[];
  unlockedAccessories: string[];
}

export interface Position {
  x: number; // tile or world units
  y: number;
}

export type Direction = 'down' | 'up' | 'left' | 'right';

export type BuildingId =
  | 'library'
  | 'quiz_arcade'
  | 'review_station'
  | 'stem_lab'
  | 'school'
  | 'achievement_plaza';

export interface BuildingInfo {
  id: BuildingId;
  name: string;
  vietnameseName: string;
  icon: string;
  color: string;
  accentColor: string;
  description: string;
  x: number; // tile x
  y: number; // tile y
  width: number; // tiles
  height: number; // tiles
  entrance: { x: number; y: number }; // interaction tile
  unlockRequirement: {
    level?: number;
    quizzesCompleted?: number;
    hasErrorsToReview?: boolean;
    description: string;
  };
}

export interface QuizQuestion {
  id: string;
  subject: 'Vật lý' | 'Hóa học' | 'Sinh học';
  grade: 'Lớp 6' | 'Lớp 7' | 'Lớp 8' | 'Lớp 9';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface MistakeRecord {
  id: string;
  question: QuizQuestion;
  userSelectedIndex: number;
  timestamp: number;
  reviewed: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  locationId: BuildingId;
  targetCount: number;
  currentCount: number;
  rewardXP: number;
  rewardPoints: number;
  completed: boolean;
  claimed: boolean;
}

export interface PlayerProgress {
  level: number;
  eduPoints: number;
  currentXP: number;
  nextLevelXP: number;
  quizzesCompleted: number;
  highScore: number;
  experimentsCompleted: string[];
  unlockedBuildings: BuildingId[];
  mistakes: MistakeRecord[];
  quests: Quest[];
  lastPosition: Position;
  lastFacing: Direction;
}
