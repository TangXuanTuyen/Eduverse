import type { BuildingId } from '@/types/game';

/** URL của từng địa điểm trên bản đồ. Mỗi địa điểm mở thành hộp thoại trên nền bản đồ. */
export const STUDENT_HOME = '/student';
export const GUEST_HOME = '/guest';

export const BUILDING_ROUTES: Record<BuildingId, string> = {
  library: '/student/library',
  quiz_arcade: '/student/arcade',
  review_station: '/student/review',
  stem_lab: '/student/stem',
  school: '/student/assignments',
  achievement_plaza: '/student/achievements',
};

export const GUEST_BUILDING_ROUTES: Record<BuildingId, string> = {
  library: '/guest/library',
  quiz_arcade: '/guest/arcade',
  review_station: '/guest/review',
  stem_lab: '/guest/stem',
  school: '/guest/assignments',
  achievement_plaza: '/guest/achievements',
};
