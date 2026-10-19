import type { BuildingId } from '@/types/game';

/** URL của từng địa điểm trên bản đồ. Mỗi địa điểm mở thành hộp thoại trên nền bản đồ. */
export const STUDENT_HOME = '/student';

export const BUILDING_ROUTES: Record<BuildingId, string> = {
  library: '/student/library',
  quiz_arcade: '/student/arcade',
  review_station: '/student/review',
  stem_lab: '/student/stem',
  school: '/student/assignments',
  achievement_plaza: '/student/achievements',
};
