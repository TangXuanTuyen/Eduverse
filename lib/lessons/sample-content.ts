import type { LessonContent } from './schema';

/**
 * Nội dung mẫu: Chương Tế bào — KHTN lớp 6
 * ⚠ Nội dung khoa học cần giáo viên kiểm tra trước khi sử dụng
 */

export const SAMPLE_LESSON_1: LessonContent = [
  {
    title: 'Em đã biết gì về tế bào?',
    phase: 'khoi_dong',
    blocks: [
      { type: 'text', content: 'Tất cả sinh vật sống đều được cấu tạo từ tế bào. Tế bào là đơn vị cơ bản của sự sống.\n\nHãy quan sát hình ảnh dưới đây và dự đoán: Tế bào trông như thế nào?' },
      {
        type: 'image',
        src: '/images/lessons/cells-overview.jpg',
        alt: 'Tổng quan các loại tế bào dưới kính hiển vi',
        caption: 'Các loại tế bào nhìn qua kính hiển vi',
        credit: 'Hình minh họa — cần thay bằng hình có giấy phép',
      },
    ],
  },
  {
    title: 'Quan sát tế bào thực vật',
    phase: 'kham_pha',
    blocks: [
      { type: 'text', content: 'Hãy quan sát mô hình 3D tế bào thực vật bên dưới. Xoay mô hình để xem các bào quan từ mọi phía.\n\nChạm vào các điểm đánh dấu trên mô hình để tìm hiểu về từng bào quan.' },
      {
        type: 'model3d',
        // Placeholder — thay bằng URL mô hình .glb có giấy phép rõ ràng
        src: '/models/plant-cell.glb',
        poster: '/images/lessons/plant-cell-poster.jpg',
        alt: 'Mô hình 3D tế bào thực vật với các bào quan',
        credit: 'Mô hình 3D — cần thay bằng mô hình có giấy phép (VD: Sketchfab CC-BY)',
        fallbackImage: '/images/lessons/plant-cell-diagram.jpg',
        fallbackCaption: 'Sơ đồ tế bào thực vật với các bào quan được chú thích',
        hotspots: [
          { position: '0.05 0.08 0.02', label: 'Nhân', description: 'Chứa vật chất di truyền ADN, điều khiển mọi hoạt động sống' },
          { position: '-0.03 0.04 0.01', label: 'Lục lạp', description: 'Chứa diệp lục, nơi diễn ra quang hợp' },
          { position: '0.06 -0.02 0.03', label: 'Ti thể', description: 'Nhà máy năng lượng — hô hấp tế bào tạo ATP' },
          { position: '0 0.1 0', label: 'Thành TB', description: 'Bằng cellulose, bảo vệ và giữ hình dạng tế bào' },
          { position: '0 -0.05 0', label: 'Không bào', description: 'Chứa dịch tế bào, dự trữ chất dinh dưỡng' },
        ],
      },
      {
        type: 'observation',
        promptPrediction: 'Trước khi quan sát, em dự đoán tế bào thực vật có những thành phần nào?',
        promptObservation: 'Sau khi quan sát mô hình, em đã nhìn thấy những bào quan nào? Mô tả hình dạng và vị trí.',
        promptExplanation: 'Tại sao tế bào thực vật có thành tế bào cứng mà tế bào động vật thì không?',
      },
    ],
  },
  {
    title: 'Cấu tạo tế bào thực vật',
    phase: 'giai_thich',
    blocks: [
      { type: 'text', content: 'Tế bào thực vật gồm các thành phần chính:\n\n• Thành tế bào: Bằng cellulose, bảo vệ và giữ hình dạng cố định cho tế bào.\n• Màng tế bào: Bao bọc tế bào chất, kiểm soát chất ra vào.\n• Tế bào chất: Chất keo lỏng chứa các bào quan.\n• Nhân: Chứa ADN — vật chất di truyền, điều khiển mọi hoạt động sống.\n• Lục lạp: Chứa sắc tố diệp lục (chlorophyll), nơi diễn ra quang hợp.\n• Ti thể: "Nhà máy năng lượng" — phân giải chất hữu cơ tạo ATP.\n• Không bào: Chứa dịch tế bào, dự trữ dinh dưỡng.' },
      {
        type: 'image',
        src: '/images/lessons/plant-cell-labeled.jpg',
        alt: 'Sơ đồ tế bào thực vật có chú thích đầy đủ',
        caption: 'Cấu tạo tế bào thực vật',
        credit: 'Hình minh họa — cần thay bằng hình có giấy phép',
      },
    ],
  },
  {
    title: 'Kiểm tra nhanh',
    phase: 'kiem_tra',
    blocks: [
      {
        type: 'question',
        questionType: 'single_choice',
        content: 'Bào quan nào được gọi là "nhà máy năng lượng" của tế bào?',
        options: [
          { id: 'a', text: 'Lục lạp' },
          { id: 'b', text: 'Ti thể (Mitochondria)' },
          { id: 'c', text: 'Nhân tế bào' },
          { id: 'd', text: 'Không bào' },
        ],
        correctAnswer: 'b',
        explanation: 'Ti thể là nơi diễn ra hô hấp tế bào, phân giải chất hữu cơ để giải phóng năng lượng ATP cho mọi hoạt động sống.',
        points: 10,
      },
      {
        type: 'question',
        questionType: 'single_choice',
        content: 'Thành phần nào chỉ có ở tế bào thực vật mà không có ở tế bào động vật?',
        options: [
          { id: 'a', text: 'Màng tế bào' },
          { id: 'b', text: 'Nhân tế bào' },
          { id: 'c', text: 'Thành tế bào và lục lạp' },
          { id: 'd', text: 'Ti thể' },
        ],
        correctAnswer: 'c',
        explanation: 'Tế bào thực vật có thành tế bào (bằng cellulose) và lục lạp (chứa diệp lục) — hai thành phần không có ở tế bào động vật.',
        points: 10,
      },
    ],
  },
  {
    title: 'Tóm tắt bài học',
    phase: 'tom_tat',
    blocks: [
      { type: 'text', content: '📝 Ghi nhớ:\n\n1. Tế bào là đơn vị cơ bản cấu tạo nên mọi sinh vật sống.\n2. Tế bào thực vật gồm: thành tế bào, màng tế bào, tế bào chất, nhân, lục lạp, ti thể, không bào.\n3. Thành tế bào và lục lạp là đặc trưng riêng của tế bào thực vật.\n4. Nhân chứa ADN — điều khiển hoạt động sống.\n5. Ti thể = nhà máy năng lượng; Lục lạp = nơi quang hợp.\n\n⚠ Nội dung khoa học mẫu — cần giáo viên kiểm tra trước khi dùng chính thức.' },
    ],
  },
];

export const SAMPLE_LESSON_2: LessonContent = [
  {
    title: 'Tế bào động vật khác gì thực vật?',
    phase: 'khoi_dong',
    blocks: [
      { type: 'text', content: 'Ở bài trước, em đã tìm hiểu tế bào thực vật. Bây giờ hãy so sánh với tế bào động vật!\n\nDự đoán: Tế bào động vật có giống tế bào thực vật không? Khác ở điểm nào?' },
    ],
  },
  {
    title: 'Quan sát tế bào động vật',
    phase: 'kham_pha',
    blocks: [
      { type: 'text', content: 'Quan sát mô hình 3D tế bào động vật. So sánh với tế bào thực vật ở bài trước.' },
      {
        type: 'model3d',
        src: '/models/animal-cell.glb',
        poster: '/images/lessons/animal-cell-poster.jpg',
        alt: 'Mô hình 3D tế bào động vật',
        credit: 'Mô hình 3D — cần thay bằng mô hình có giấy phép',
        fallbackImage: '/images/lessons/animal-cell-diagram.jpg',
        fallbackCaption: 'Sơ đồ tế bào động vật',
        hotspots: [
          { position: '0 0.05 0', label: 'Nhân', description: 'Chứa ADN, trung tâm điều khiển' },
          { position: '0.04 -0.02 0', label: 'Ti thể', description: 'Hô hấp tế bào, tạo năng lượng' },
          { position: '-0.04 0 0.02', label: 'Lưới nội chất', description: 'Tổng hợp và vận chuyển protein' },
          { position: '0.02 0.03 -0.01', label: 'Ribosome', description: 'Nơi tổng hợp protein' },
        ],
      },
      {
        type: 'observation',
        promptPrediction: 'Trước khi quan sát, em nghĩ tế bào động vật có gì giống và khác tế bào thực vật?',
        promptObservation: 'Em nhận thấy tế bào động vật thiếu những bào quan nào so với tế bào thực vật?',
        promptExplanation: 'Tại sao tế bào động vật không có lục lạp?',
      },
    ],
  },
  {
    title: 'So sánh hai loại tế bào',
    phase: 'giai_thich',
    blocks: [
      { type: 'text', content: 'SO SÁNH TẾ BÀO THỰC VẬT VÀ ĐỘNG VẬT:\n\nGiống nhau:\n• Đều có màng tế bào, tế bào chất, nhân, ti thể, ribosome\n• Đều là đơn vị cơ bản của sự sống\n\nKhác nhau:\n• Tế bào thực vật CÓ: thành tế bào, lục lạp, không bào lớn\n• Tế bào động vật KHÔNG CÓ: thành tế bào, lục lạp\n• Tế bào động vật có: trung thể (giúp phân bào), lysosome (tiêu hóa nội bào)\n• Hình dạng: TV cố định (do thành TB), ĐV linh hoạt (không có thành TB)' },
    ],
  },
  {
    title: 'Kiểm tra',
    phase: 'kiem_tra',
    blocks: [
      {
        type: 'question',
        questionType: 'single_choice',
        content: 'Tế bào động vật KHÔNG có thành phần nào sau đây?',
        options: [
          { id: 'a', text: 'Nhân tế bào' },
          { id: 'b', text: 'Ti thể' },
          { id: 'c', text: 'Thành tế bào' },
          { id: 'd', text: 'Màng tế bào' },
        ],
        correctAnswer: 'c',
        explanation: 'Tế bào động vật không có thành tế bào. Chỉ tế bào thực vật mới có thành tế bào bằng cellulose.',
        points: 10,
      },
    ],
  },
  {
    title: 'Tóm tắt',
    phase: 'tom_tat',
    blocks: [
      { type: 'text', content: '📝 Ghi nhớ:\n\n1. TB thực vật và động vật đều có: màng, nhân, tế bào chất, ti thể.\n2. Chỉ TB thực vật có: thành TB, lục lạp, không bào lớn.\n3. Chỉ TB động vật có: trung thể, lysosome.\n4. Hình dạng: TV cố định, ĐV linh hoạt.\n\n⚠ Nội dung khoa học mẫu — cần giáo viên kiểm tra.' },
    ],
  },
];

export const SAMPLE_LESSON_3: LessonContent = [
  {
    title: 'Kính hiển vi — công cụ khám phá tế bào',
    phase: 'khoi_dong',
    blocks: [
      { type: 'text', content: 'Tế bào rất nhỏ, mắt thường không thể nhìn thấy. Vậy các nhà khoa học đã quan sát tế bào bằng cách nào?\n\nĐáp án: Kính hiển vi! Hãy tìm hiểu cách sử dụng kính hiển vi đúng cách.' },
    ],
  },
  {
    title: 'Mô phỏng kính hiển vi',
    phase: 'kham_pha',
    blocks: [
      { type: 'text', content: 'Sử dụng mô phỏng bên dưới để thực hành thao tác với kính hiển vi. Hãy thử thay đổi vật kính và điều chỉnh tiêu cự.' },
      {
        type: 'phet_sim',
        simName: 'geometric-optics',
        fallbackImage: '/images/lessons/microscope-diagram.jpg',
        fallbackGuide: 'Nếu không tải được mô phỏng, hãy xem sơ đồ nguyên lý kính hiển vi và đọc hướng dẫn sử dụng trong phần giải thích.',
      },
      {
        type: 'observation',
        promptPrediction: 'Khi tăng độ phóng đại, em nghĩ hình ảnh sẽ thay đổi như thế nào?',
        promptObservation: 'Mô tả những gì em quan sát được khi thay đổi vật kính từ 4x sang 10x rồi 40x.',
        promptExplanation: 'Tại sao khi tăng độ phóng đại, trường nhìn lại hẹp hơn?',
      },
    ],
  },
  {
    title: 'Cách sử dụng kính hiển vi',
    phase: 'giai_thich',
    blocks: [
      { type: 'text', content: 'QUY TRÌNH SỬ DỤNG KÍNH HIỂN VI:\n\n1. Đặt kính trên mặt phẳng, bật nguồn sáng.\n2. Xoay vật kính 4x (độ phóng đại nhỏ nhất) về vị trí.\n3. Đặt tiêu bản lên bàn kính, kẹp bằng kẹp giữ.\n4. Nhìn từ bên cạnh, vặn ốc thô hạ vật kính gần tiêu bản.\n5. Nhìn qua thị kính, từ từ nâng vật kính bằng ốc thô cho đến khi thấy hình ảnh.\n6. Xoay ốc tinh chỉnh để hình ảnh rõ nét.\n7. Chuyển sang vật kính lớn hơn (10x, 40x) để xem chi tiết.\n\n⚠ QUY TẮC AN TOÀN:\n• Không chạm tay vào thấu kính.\n• Luôn bắt đầu từ vật kính nhỏ nhất.\n• Khi hạ vật kính, phải nhìn từ bên cạnh để tránh va chạm.' },
    ],
  },
  {
    title: 'Kiểm tra',
    phase: 'kiem_tra',
    blocks: [
      {
        type: 'question',
        questionType: 'single_choice',
        content: 'Khi bắt đầu quan sát bằng kính hiển vi, ta nên sử dụng vật kính nào trước?',
        options: [
          { id: 'a', text: 'Vật kính 40x' },
          { id: 'b', text: 'Vật kính 10x' },
          { id: 'c', text: 'Vật kính 4x (nhỏ nhất)' },
          { id: 'd', text: 'Bất kỳ vật kính nào' },
        ],
        correctAnswer: 'c',
        explanation: 'Luôn bắt đầu từ vật kính có độ phóng đại nhỏ nhất (4x) để dễ tìm mẫu vật, sau đó mới chuyển sang vật kính lớn hơn.',
        points: 10,
      },
    ],
  },
  {
    title: 'Tóm tắt',
    phase: 'tom_tat',
    blocks: [
      { type: 'text', content: '📝 Ghi nhớ:\n\n1. Kính hiển vi giúp quan sát vật thể rất nhỏ mà mắt thường không thấy.\n2. Luôn bắt đầu từ vật kính nhỏ nhất (4x).\n3. Sử dụng ốc thô để lấy nét sơ bộ, ốc tinh chỉnh để rõ nét.\n4. Không chạm tay vào thấu kính.\n\n⚠ Nội dung khoa học mẫu — cần giáo viên kiểm tra.' },
    ],
  },
];

export const SAMPLE_LESSONS = [
  {
    title: 'Tế bào thực vật',
    description: 'Cấu tạo tế bào thực vật: thành tế bào, nhân, lục lạp, ti thể, không bào. Quan sát mô hình 3D.',
    subject: 'sinh_hoc' as const,
    grade_level: 6,
    chapter: 'Chương 1 - Tế bào',
    content: SAMPLE_LESSON_1,
  },
  {
    title: 'So sánh tế bào thực vật và động vật',
    description: 'Điểm giống và khác nhau giữa tế bào thực vật và tế bào động vật. Mô hình 3D tế bào động vật.',
    subject: 'sinh_hoc' as const,
    grade_level: 6,
    chapter: 'Chương 1 - Tế bào',
    content: SAMPLE_LESSON_2,
  },
  {
    title: 'Sử dụng kính hiển vi',
    description: 'Cách sử dụng kính hiển vi quang học. Quy trình, quy tắc an toàn, mô phỏng PhET.',
    subject: 'sinh_hoc' as const,
    grade_level: 6,
    chapter: 'Chương 1 - Tế bào',
    content: SAMPLE_LESSON_3,
  },
];
