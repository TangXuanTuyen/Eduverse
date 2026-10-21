export type LessonResource = {
  id: string;
  title: string;
  subject: string;
  grade: number;
};

export type ExperimentResource = {
  id: string;
  title: string;
  subject: string;
  grade: number;
};

export const LESSON_CATALOG: LessonResource[] = [
  { id: 'optics_law', title: 'Định luật phản xạ ánh sáng', subject: 'Vật lý', grade: 7 },
  { id: 'atom_model', title: 'Mô hình nguyên tử', subject: 'Hóa học', grade: 7 },
  { id: 'photosynthesis', title: 'Quang hợp ở thực vật', subject: 'Sinh học', grade: 6 },
];

export const EXPERIMENT_CATALOG: ExperimentResource[] = [
  { id: 'vat_dan_dien_cach_dien', title: 'Vật dẫn điện, vật cách điện & Điện nghiệm', subject: 'Vật lý', grade: 8 },
  { id: 'simple_circuit', title: 'Lắp mạch điện đơn giản', subject: 'Vật lý', grade: 8 },
  { id: 'demo_acid_base', title: 'Phản ứng axit – bazơ', subject: 'Hóa học', grade: 8 },
  { id: 'demo_cell', title: 'Quan sát tế bào thực vật', subject: 'Sinh học', grade: 6 },
  { id: 'demo_force', title: 'Lực và chuyển động', subject: 'Vật lý', grade: 8 },
];
