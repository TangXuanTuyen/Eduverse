import type { BuildingId } from '@/types/game';

export interface BuildingNotification {
  type: 'assignment' | 'review' | 'achievement' | 'notification';
  label: string;
}

export interface TownBuilding {
  id: BuildingId;
  zone: 'north' | 'east' | 'west' | 'south' | 'center';
  unlockChapter?: number;
}

export const TOWN_BUILDINGS: Record<BuildingId, TownBuilding> = {
  school: { id: 'school', zone: 'north' },
  library: { id: 'library', zone: 'west' },
  stem_lab: { id: 'stem_lab', zone: 'east', unlockChapter: 1 },
  quiz_arcade: { id: 'quiz_arcade', zone: 'west' },
  review_station: { id: 'review_station', zone: 'east', unlockChapter: 1 },
  achievement_plaza: { id: 'achievement_plaza', zone: 'south' },
  virtual_lab: { id: 'virtual_lab', zone: 'west' },
  world_3d: { id: 'world_3d', zone: 'east' },
};

export const PRESET_EMOTES = ['👍', '🎉', '🤔', '👋'] as const;
export type PresetEmote = (typeof PRESET_EMOTES)[number];

export const CONTEXT_PHRASES: Record<string, string[]> = {
  default: ['Chào bạn!', 'Cùng học nào!', 'Tuyệt vời!', 'Cảm ơn!'],
  quiz: ['Bạn giỏi quá!', 'Câu này khó ghê!', 'Mình cũng sai!', 'Cố lên!'],
  stem: ['Thí nghiệm hay!', 'Cẩn thận nha!', 'Quan sát kỹ!', 'Kết quả gì?'],
};

export const MAX_VISIBLE_AVATARS = 15;
export const PRESENCE_BROADCAST_INTERVAL_MS = 200;
