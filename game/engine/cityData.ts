/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BuildingInfo, BuildingId } from '@/types/game';
import { RectCollider } from './collision';

export const MAP_TILES_X = 36;
export const MAP_TILES_Y = 24;
export const TILE_SIZE = 48; // px

export const BUILDINGS: Record<BuildingId, BuildingInfo> = {
  school: {
    id: 'school',
    name: 'School',
    vietnameseName: 'Trường THCS VINA-EDUVERSE',
    icon: '🏫',
    color: '#1E3A8A', // Deep architectural blue
    accentColor: '#3B82F6', // Vivid blue trim
    description: 'Nơi tiếp nhận nhiệm vụ học tập, bài tập về nhà và thông báo từ thầy cô giáo KHTN.',
    x: 13,
    y: 2,
    width: 10,
    height: 4.5,
    entrance: { x: 18, y: 7 },
    unlockRequirement: {
      description: 'Mở cửa tự do cho mọi học sinh VINA-EDUVERSE.',
    },
  },
  library: {
    id: 'library',
    name: 'Library',
    vietnameseName: 'Thư Viện Tri Thức KHTN',
    icon: '📚',
    color: '#0369A1',
    accentColor: '#38BDF8',
    description: 'Kho tàng lý thuyết Khoa học tự nhiên THCS (Vật lý, Hóa học, Sinh học) với sơ đồ tương tác.',
    x: 3,
    y: 4,
    width: 7,
    height: 5,
    entrance: { x: 6.5, y: 9.5 },
    unlockRequirement: {
      description: 'Mở sẵn đón chào học sinh nghiên cứu bài học mới.',
    },
  },
  stem_lab: {
    id: 'stem_lab',
    name: 'STEM Lab',
    vietnameseName: 'Phòng Thí Nghiệm STEM',
    icon: '🧪',
    color: '#065F46',
    accentColor: '#34D399',
    description: 'Thực hành mô phỏng: Thử Axit/Bazơ quỳ tím, Mạch điện thắp sáng, Kính hiển vi tế bào.',
    x: 26,
    y: 4,
    width: 7,
    height: 5,
    entrance: { x: 29.5, y: 9.5 },
    unlockRequirement: {
      quizzesCompleted: 1,
      level: 2,
      description: 'Khóa: Cần hoàn thành 1 trận Quiz Arcade hoặc đạt Cấp 2 để mở khóa phòng thí nghiệm!',
    },
  },
  quiz_arcade: {
    id: 'quiz_arcade',
    name: 'Quiz Arcade',
    vietnameseName: 'Đấu Trường Quiz Arcade',
    icon: '⚡',
    color: '#5B21B6',
    accentColor: '#A78BFA',
    description: 'Đấu trường thử thách trắc nghiệm KHTN tính giờ, chuỗi combo điểm số và nhận EduPoints.',
    x: 3.5,
    y: 15,
    width: 6.5,
    height: 4.5,
    entrance: { x: 6.75, y: 14.5 },
    unlockRequirement: {
      description: 'Mở cửa 24/7 để học sinh rèn luyện tư duy phản xạ.',
    },
  },
  review_station: {
    id: 'review_station',
    name: 'Review Station',
    vietnameseName: 'Trạm Sửa Lỗi Cứu Nguy',
    icon: '🛠️',
    color: '#9A3412',
    accentColor: '#EA580C',
    description: 'Kho lưu trữ và phân tích những câu trả lời sai, giải thích cặn kẽ và thử thách làm lại.',
    x: 26,
    y: 15,
    width: 6.5,
    height: 4.5,
    entrance: { x: 29.25, y: 14.5 },
    unlockRequirement: {
      hasErrorsToReview: true,
      description: 'Khóa: Sẽ mở ngay khi bạn có câu trả lời sai cần ôn lại tại Quiz Arcade!',
    },
  },
  achievement_plaza: {
    id: 'achievement_plaza',
    name: 'Achievement Plaza',
    vietnameseName: 'Quảng Trường Vinh Danh',
    icon: '🏆',
    color: '#B45309',
    accentColor: '#FBBF24',
    description: 'Bảng vinh danh cấp độ, tủ trưng bày huy hiệu THCS và mở khóa trang phục học sinh.',
    x: 14.5,
    y: 16,
    width: 7,
    height: 4.5,
    entrance: { x: 18, y: 15.2 },
    unlockRequirement: {
      description: 'Nơi vinh danh thành tích học tập cá nhân.',
    },
  },
  virtual_lab: {
    id: 'virtual_lab',
    name: 'Virtual Lab',
    vietnameseName: 'Phòng Thí Nghiệm Ảo',
    icon: '🔬',
    color: '#7C2D12',
    accentColor: '#F97316',
    description: 'Mô phỏng thí nghiệm KHTN: mạch điện, phản ứng hóa học, lực và chuyển động — an toàn, không giới hạn.',
    x: 1,
    y: 10,
    width: 6,
    height: 4,
    entrance: { x: 4, y: 14.5 },
    unlockRequirement: {
      description: 'Mở cửa cho mọi học sinh muốn thí nghiệm.',
    },
  },
  world_3d: {
    id: 'world_3d',
    name: '3D World',
    vietnameseName: 'Thế Giới 3D',
    icon: '🌐',
    color: '#1E3A5F',
    accentColor: '#06B6D4',
    description: 'Khám phá mô hình 3D: tế bào, hệ mặt trời, cấu trúc phân tử — xoay, phóng to, tương tác.',
    x: 29,
    y: 10,
    width: 6,
    height: 4,
    entrance: { x: 32, y: 14.5 },
    unlockRequirement: {
      description: 'Mở cửa cho mọi học sinh muốn khám phá.',
    },
  },
};

export function getCityColliders(): RectCollider[] {
  const colliders: RectCollider[] = [];

  // Add all 6 buildings
  Object.values(BUILDINGS).forEach((b) => {
    colliders.push({
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
      tag: b.id,
    });
  });

  // Central Fountain in middle plaza
  colliders.push({
    x: 16,
    y: 10,
    width: 4,
    height: 4,
    tag: 'fountain',
  });

  // Flagpole near School entrance
  colliders.push({
    x: 14.8,
    y: 6.8,
    width: 0.8,
    height: 0.8,
    tag: 'flagpole',
  });

  // Decorative Park Trees & Benches (solid obstacles)
  const decorativeObstacles: RectCollider[] = [
    // Flanking School Courtyard
    { x: 11, y: 3.5, width: 1.8, height: 1.8, tag: 'tree' },
    { x: 23.2, y: 3.5, width: 1.8, height: 1.8, tag: 'tree' },

    // Western park trees (moved to avoid virtual_lab)
    { x: 8, y: 11, width: 1.8, height: 1.8, tag: 'tree' },
    { x: 10.5, y: 11, width: 1.8, height: 1.8, tag: 'tree' },

    // Eastern park trees (moved to avoid world_3d)
    { x: 23.5, y: 11, width: 1.8, height: 1.8, tag: 'tree' },
    { x: 27, y: 11, width: 1.8, height: 1.8, tag: 'tree' },

    // Fountain plaza stone benches
    { x: 14, y: 11, width: 1, height: 1.5, tag: 'bench' },
    { x: 21, y: 11, width: 1, height: 1.5, tag: 'bench' },
  ];

  return [...colliders, ...decorativeObstacles];
}

/**
 * Checks if a position is within the entrance proximity of any building
 */
export function getProximityBuilding(
  playerX: number,
  playerY: number,
  threshold = 1.9
): BuildingInfo | null {
  for (const b of Object.values(BUILDINGS)) {
    const dist = Math.hypot(playerX - b.entrance.x, playerY - b.entrance.y);
    if (dist <= threshold) {
      return b;
    }
  }
  return null;
}
