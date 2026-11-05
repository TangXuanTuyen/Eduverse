/**
 * Kho câu hỏi tích hợp trong các bài STEM Maker (lấy nguyên văn từ bài gốc).
 * Máy chủ dùng kho này để chấm và đưa câu sai vào Trạm Sửa Lỗi, không tin kết quả do trình duyệt báo.
 * Nội dung do tác giả bài gốc soạn; cần giáo viên kiểm tra lại khi cập nhật bài.
 */

export type StemQuizQuestion = {
  id: string;
  content: string;
  options: { id: string; text: string }[];
  /** Mã các đáp án đúng; một phần tử với câu chọn một. */
  correct: string[];
  multiple?: boolean;
  explanation: string;
};

export type StemQuiz = { title: string; questions: StemQuizQuestion[] };

export const STEM_QUIZZES: Record<string, StemQuiz> = {
  'pin-volta': {
    title: 'Lắp ráp pin Volta (Zn-Cu)',
    questions: [
      {
        id: 'q1',
        content: 'Trong pin Zn - Cu, electron ở mạch ngoài chạy theo chiều nào?',
        options: [
          { id: 'Zn_to_Cu', text: 'Từ Zn sang Cu' },
          { id: 'Cu_to_Zn', text: 'Từ Cu sang Zn' },
        ],
        correct: ['Zn_to_Cu'],
        explanation: 'Ở mạch ngoài, electron chạy từ cực âm (Zn) sang cực dương (Cu), ngược chiều quy ước của dòng điện.',
      },
    ],
  },
  'xe-dap-phat-dien': {
    title: 'Xe đạp phát điện (Dynamo)',
    questions: [
      {
        id: 'q1',
        content: 'Khi học sinh đạp xe để thắp sáng dàn đèn, chuỗi chuyển hóa năng lượng diễn ra theo thứ tự nào sau đây?',
        options: [
          { id: 'A', text: 'Cơ năng người đạp ➔ Hóa năng bánh đà ➔ Quang năng ➔ Điện năng' },
          { id: 'B', text: 'Hóa năng (cơ bắp) ➔ Cơ năng (bàn đạp & bánh đà) ➔ Điện năng (qua Dynamo) ➔ Quang năng & Nhiệt năng (bóng đèn)' },
          { id: 'C', text: 'Điện năng từ nguồn ➔ Cơ năng xe đạp ➔ Quang năng phát sáng' },
          { id: 'D', text: 'Quang năng mặt trời ➔ Cơ năng xe đạp ➔ Điện năng dự trữ' },
        ],
        correct: ['B'],
        explanation: 'Năng lượng từ thức ăn chuyển hóa thành hóa năng trong cơ bắp, sinh công cơ học (cơ năng) làm quay bánh đà. Dynamo chuyển cơ năng thành điện năng, và cuối cùng bóng đèn biến điện năng thành ánh sáng (quang năng) và tỏa nhiệt.',
      },
      {
        id: 'q2',
        content: 'Bộ phận cốt lõi nào trong mô hình xe đạp có chức năng biến đổi trực tiếp chuyển động quay (cơ năng) thành dòng điện?',
        options: [
          { id: 'A', text: 'Khung sườn xe đạp chịu lực và yên ngồi' },
          { id: 'B', text: 'Xích tải và cụm đĩa líp truyền động' },
          { id: 'C', text: 'Củ phát điện (Dynamo / Máy phát) chứa cuộn dây đồng và nam châm vĩnh cửu' },
          { id: 'D', text: 'Dây tóc vonfram bên trong bóng đèn sợi đốt' },
        ],
        correct: ['C'],
        explanation: 'Dynamo hoạt động dựa trên hiện tượng cảm ứng điện từ: khi bánh đà làm quay roto gắn nam châm (hoặc cuộn dây), từ thông gửi qua cuộn dây đồng biến thiên liên tục, sinh ra dòng điện cảm ứng.',
      },
      {
        id: 'q3',
        content: 'Nếu học sinh tăng tốc độ chạy/đạp xe nhanh gấp đôi (tăng RPM máy phát), hiện tượng gì sẽ xảy ra với dòng điện và bóng đèn?',
        options: [
          { id: 'A', text: 'Hiệu điện thế (V) và công suất điện (W) tăng lên, làm bóng đèn sáng mạnh rực rỡ hơn' },
          { id: 'B', text: 'Hiệu điện thế giảm xuống và bóng đèn mờ dần' },
          { id: 'C', text: 'Độ sáng bóng đèn giữ nguyên không đổi vì số lượng bóng đèn không đổi' },
          { id: 'D', text: 'Dòng điện biến mất ngay lập tức do ma sát bánh đà' },
        ],
        correct: ['A'],
        explanation: 'Tốc độ quay càng lớn thì từ thông biến thiên càng nhanh, tạo ra suất điện động (V) càng cao. Khi hiệu điện thế tăng, công suất điện P = U²/R tăng mạnh khiến nhiệt độ dây tóc tăng và phát sáng rực rỡ hơn.',
      },
    ],
  },
  'thuy-dien': {
    title: 'Thiết kế nhà máy thủy điện mini',
    questions: [
      {
        id: 'q1',
        content: 'Thủy điện chuyển hóa dạng năng lượng nào thành điện năng?',
        options: [
          { id: 'opt1', text: 'Chuyển hóa thế năng của dòng nước trên cao thành điện năng cung cấp tối thiểu 50 kW cho bản làng.' },
          { id: 'opt2', text: 'Đốt than đá để lấy nhiệt năng đun sôi nước làm quay quạt máy lạnh.' },
        ],
        correct: ['opt1'],
        explanation: 'Đáp án đúng: chuyển hóa thế năng của dòng nước trên cao thành điện năng.',
      },
      {
        id: 'q2',
        content: 'Những yếu tố nào quyết định lượng điện tạo ra? (Chọn 3 đáp án đúng)',
        options: [
          { id: 'H', text: 'Cột nước H (Độ cao hồ nước)' },
          { id: 'Q', text: 'Lưu lượng xả Q (Lượng nước chảy vào tuabin)' },
          { id: 'eta', text: 'Hiệu suất máy η (Chất lượng máy móc)' },
          { id: 'weather', text: 'Màu sơn bên ngoài máy phát điện' },
        ],
        correct: ['H', 'Q', 'eta'],
        multiple: true,
        explanation: 'Đáp án đúng: Cột nước H, Lưu lượng xả Q và Hiệu suất máy η. Màu sơn bên ngoài không ảnh hưởng đến lượng điện tạo ra.',
      },
    ],
  },
};

export function getStemQuestion(projectId: string, questionId: string): StemQuizQuestion | null {
  return STEM_QUIZZES[projectId]?.questions.find((q) => q.id === questionId) ?? null;
}

/** Chấm một câu theo kho; câu chọn nhiều đúng khi chọn đủ và chỉ chọn các đáp án đúng. */
export function gradeStemAnswer(question: StemQuizQuestion, answer: unknown): boolean {
  const chosen = (Array.isArray(answer) ? answer : [answer]).map((v) => String(v)).sort();
  const correct = [...question.correct].sort();
  return chosen.length === correct.length && chosen.every((v, i) => v === correct[i]);
}
