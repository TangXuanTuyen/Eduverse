export const LOCALES = ['vi', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'vi';
export const LOCALE_COOKIE = 'eduverse_locale';

export function isLocale(value: string | undefined): value is Locale {
  return value === 'vi' || value === 'en';
}

const vi = {
  'shell.sidebar.teacher': 'Giáo viên',
  'shell.sidebar.admin': 'Quản trị',
  'shell.sidebar.parent': 'Phụ huynh',
  'shell.sidebar.student': 'Học sinh',
  'shell.user.noName': 'Chưa đặt tên',
  'shell.language': 'Ngôn ngữ',
  'nav.teacher.rooms': 'Phòng học',
  'nav.teacher.questions': 'Ngân hàng câu hỏi',
  'nav.teacher.assignments': 'Bài giao',
  'nav.teacher.games': 'Xưởng trò chơi',
  'nav.teacher.stemMaker': 'STEM Maker',
  'nav.teacher.labs': 'Thí nghiệm',
  'nav.teacher.models': 'Mô hình 3D',
  'nav.teacher.lessons': 'Bài học',
  'nav.teacher.grading': 'Chấm bài',
  'nav.teacher.reports': 'Báo cáo',
  'nav.parent.overview': 'Tổng quan',
  'nav.parent.weeklyReports': 'Báo cáo tuần',
  'nav.admin.experiments': 'Thí nghiệm',
  'nav.admin.models': 'Mô hình 3D',
  'nav.admin.lessons': 'Bài học',
  'footer.vina': 'Vina - Eduverse',
  'footer.hotline': 'Hotline',
  'footer.email': 'Email',
  'footer.developedBy': 'Phát triển bởi',
} as const;

export type DictKey = keyof typeof vi;
export type Dict = Record<DictKey, string>;

const en: Dict = {
  'shell.sidebar.teacher': 'Teacher',
  'shell.sidebar.admin': 'Admin',
  'shell.sidebar.parent': 'Parent',
  'shell.sidebar.student': 'Student',
  'shell.user.noName': 'No name yet',
  'shell.language': 'Language',
  'nav.teacher.rooms': 'Classrooms',
  'nav.teacher.questions': 'Question bank',
  'nav.teacher.assignments': 'Assignments',
  'nav.teacher.games': 'Game workshop',
  'nav.teacher.stemMaker': 'STEM Maker',
  'nav.teacher.labs': 'Experiments',
  'nav.teacher.models': '3D models',
  'nav.teacher.lessons': 'Lessons',
  'nav.teacher.grading': 'Grading',
  'nav.teacher.reports': 'Reports',
  'nav.parent.overview': 'Overview',
  'nav.parent.weeklyReports': 'Weekly reports',
  'nav.admin.experiments': 'Experiments',
  'nav.admin.models': '3D models',
  'nav.admin.lessons': 'Lessons',
  'footer.vina': 'Vina - Eduverse',
  'footer.hotline': 'Hotline',
  'footer.email': 'Email',
  'footer.developedBy': 'Developed by',
};

export const DICTS: Record<Locale, Dict> = { vi, en };

export function translate(locale: Locale, key: DictKey): string {
  return DICTS[locale][key] ?? vi[key];
}
