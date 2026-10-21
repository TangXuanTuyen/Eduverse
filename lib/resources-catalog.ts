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

export type Model3DResource = {
  id: string;
  title: string;
  grade: number;
};

export const MODEL3D_CATALOG: Model3DResource[] = [
  { id: 'demo_cell_3d', title: 'Tế bào động vật', grade: 6 },
  { id: 'demo_solar', title: 'Hệ Mặt Trời', grade: 6 },
  { id: 'demo_water', title: 'Phân tử nước (H₂O)', grade: 7 },
  { id: 'demo_heart', title: 'Tim người', grade: 8 },
  { id: 'demo_nacl', title: 'Tinh thể NaCl', grade: 8 },
];

export type StemResource = {
  id: string;
  title: string;
  subject: string;
};

export const STEM_CATALOG: StemResource[] = [
  { id: 'litmus', title: 'Nhận biết Axit - Bazơ bằng quỳ tím', subject: 'Hóa học' },
  { id: 'circuit', title: 'Lắp mạch điện kín thắp sáng bóng đèn', subject: 'Vật lý' },
  { id: 'microscope', title: 'Kính hiển vi quan sát tế bào thực vật', subject: 'Sinh học' },
];

export const EXPERIMENT_CATALOG: ExperimentResource[] = [
  { id: 'vat_dan_dien_cach_dien', title: 'Vật dẫn điện, vật cách điện & Điện nghiệm', subject: 'Vật lý', grade: 8 },
  { id: 'simple_circuit', title: 'Lắp mạch điện đơn giản', subject: 'Vật lý', grade: 8 },
  { id: 'demo_acid_base', title: 'Phản ứng axit – bazơ', subject: 'Hóa học', grade: 8 },
  { id: 'demo_cell', title: 'Quan sát tế bào thực vật', subject: 'Sinh học', grade: 6 },
  { id: 'demo_force', title: 'Lực và chuyển động', subject: 'Vật lý', grade: 8 },
];
