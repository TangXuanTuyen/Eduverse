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
  /** Câu nhập số: đúng khi sai lệch không quá tolerance so với value. */
  numeric?: { value: number; tolerance: number };
  explanation: string;
};

/** kind: 'lab' là thí nghiệm ảo, 'model3d' là mô phỏng 3D, mặc định là bài STEM Maker. */
export type StemQuiz = { title: string; kind?: 'stem' | 'lab' | 'model3d'; questions: StemQuizQuestion[] };

export const STEM_QUIZZES: Record<string, StemQuiz> = {
  'te-bao-nhan-so-3d': {
    title: 'Tế bào nhân sơ 3D',
    kind: 'model3d',
    questions: [
      {
        id: "q1",
        content: "Vì sao vi khuẩn được gọi là tế bào nhân sơ?",
        options: [{ id: "A", text: "Vì vi khuẩn không có vật chất di truyền ADN." }, { id: "B", text: "Vì vùng nhân chứa ADN chưa có màng nhân bao bọc." }, { id: "C", text: "Vì vi khuẩn không có thành tế bào bảo vệ." }, { id: "D", text: "Vì vi khuẩn chỉ sống được ở nhiệt độ rất cao." }],
        correct: ["B"],
        explanation: "Tế bào nhân sơ có đặc điểm cốt lõi là vật chất di truyền (ADN) tập trung ở vùng nhân và chưa có màng nhân ngăn cách với tế bào chất.",
      },
      {
        id: "q2",
        content: "Thành phần nào quy định hình dạng tế bào và bảo vệ tế bào vi khuẩn khỏi bị vỡ?",
        options: [{ id: "A", text: "Thành tế bào" }, { id: "B", text: "Màng tế bào" }, { id: "C", text: "Vùng nhân" }, { id: "D", text: "Roi" }],
        correct: ["A"],
        explanation: "Thành tế bào đóng vai trò như bộ khung vững chắc tạo nên hình dạng tế bào và chống lại áp suất thẩm thấu.",
      },
      {
        id: "q3",
        content: "Cấu trúc nào kiểm soát có chọn lọc các chất đi vào và đi ra khỏi tế bào vi khuẩn?",
        options: [{ id: "A", text: "Thành tế bào" }, { id: "B", text: "Màng tế bào (màng sinh chất)" }, { id: "C", text: "Lông nhung" }, { id: "D", text: "Vùng nhân" }],
        correct: ["B"],
        explanation: "Màng tế bào có tính thấm chọn lọc giúp điều hòa trao đổi chất giữa tế bào và môi trường ngoài.",
      },
      {
        id: "q4",
        content: "Bộ phận nào giúp vi khuẩn bơi và di chuyển trong môi trường lỏng?",
        options: [{ id: "A", text: "Lông bám" }, { id: "B", text: "Thành tế bào" }, { id: "C", text: "Roi (tiên mao)" }, { id: "D", text: "Màng tế bào" }],
        correct: ["C"],
        explanation: "Roi dài xoay tròn giúp đẩy vi khuẩn bơi nhanh về nguồn dinh dưỡng.",
      },
      {
        id: "q5",
        content: "Sự khác biệt chính giữa Lông và Roi của vi khuẩn là gì?",
        options: [{ id: "A", text: "Lông giúp di chuyển, roi giúp bám dính." }, { id: "B", text: "Lông ngắn giúp bám dính, roi dài giúp di chuyển." }, { id: "C", text: "Lông ở trong tế bào, roi ở ngoài tế bào." }, { id: "D", text: "Lông chứa ADN, roi chứa lipid." }],
        correct: ["B"],
        explanation: "Lông (pili) số lượng nhiều và ngắn giúp bám dính giá thể, còn roi dài dùng để bơi di chuyển.",
      },
    ],
  },
  'te-bao-nhan-thuc-3d': {
    title: 'Tế bào nhân thực 3D',
    kind: 'model3d',
    questions: [
      {
        id: "q1",
        content: "Bào quan nào được ví như \"Bộ não\" hay \"Trung tâm chỉ huy\" của tế bào nhân thực?",
        options: [{ id: "A", text: "Nhân tế bào" }, { id: "B", text: "Ti thể" }, { id: "C", text: "Ribosome" }, { id: "D", text: "Màng tế bào" }],
        correct: ["A"],
        explanation: "Nhân tế bào chứa vật chất di truyền (DNA), chỉ đạo mọi hoạt động sống và sinh trưởng của tế bào.",
      },
      {
        id: "q2",
        content: "Bào quan nào được xem là \"Nhà máy năng lượng\", cung cấp ATP cho tế bào hoạt động?",
        options: [{ id: "A", text: "Ti thể" }, { id: "B", text: "Bộ máy Golgi" }, { id: "C", text: "Lysosome" }, { id: "D", text: "Trung thể" }],
        correct: ["A"],
        explanation: "Ti thể thực hiện hô hấp tế bào để chuyển hóa chất dinh dưỡng thành năng lượng ATP nuôi tế bào.",
      },
      {
        id: "q3",
        content: "Thành phần nào có vai trò bao bọc, bảo vệ và kiểm soát các chất ra vào tế bào?",
        options: [{ id: "A", text: "Màng tế bào" }, { id: "B", text: "Tế bào chất" }, { id: "C", text: "Nhân con" }, { id: "D", text: "Trung tử" }],
        correct: ["A"],
        explanation: "Màng tế bào ngăn cách tế bào với môi trường và có tính thấm chọn lọc các chất qua lại.",
      },
      {
        id: "q4",
        content: "Ribosome là bào quan thực hiện chức năng sinh học chính nào sau đây?",
        options: [{ id: "A", text: "Tổng hợp protein" }, { id: "B", text: "Tạo ra oxy" }, { id: "C", text: "Tiêu hóa vi khuẩn" }, { id: "D", text: "Phân chia tế bào" }],
        correct: ["A"],
        explanation: "Ribosome là \"xưởng sản xuất\" lắp ráp các phân tử protein thiết yếu cho tế bào.",
      },
      {
        id: "q5",
        content: "Đặc điểm quan trọng nhất giúp phân biệt tế bào nhân thực với tế bào nhân sơ là gì?",
        options: [{ id: "A", text: "Có nhân hoàn chỉnh được bao bọc bởi màng nhân" }, { id: "B", text: "Có màng tế bào bao quanh" }, { id: "C", text: "Có chứa chất tế bào" }, { id: "D", text: "Có kích thước siêu nhỏ nhìn qua kính hiển vi" }],
        correct: ["A"],
        explanation: "Tế bào nhân thực có nhân được bọc bởi màng nhân kép và có nhiều bào quan có màng bọc, còn tế bào nhân sơ chỉ có vùng nhân trần.",
      },
      {
        id: "q6",
        content: "Bộ máy Golgi có nhiệm vụ tương tự như bộ phận nào trong đời sống hàng ngày?",
        options: [{ id: "A", text: "Bưu điện tiếp nhận, đóng gói và gửi bưu kiện" }, { id: "B", text: "Nhà máy phát điện thắp sáng" }, { id: "C", text: "Bức tường bảo vệ ngôi nhà" }, { id: "D", text: "Bình chứa nước uống" }],
        correct: ["A"],
        explanation: "Bộ máy Golgi nhận protein từ lưới nội chất, hoàn thiện và đóng gói vào các túi bưu kiện vận chuyển đến nơi cần thiết.",
      },
      {
        id: "q7",
        content: "Nếu màng của toàn bộ lysosome trong một tế bào bị vỡ, điều gì sẽ xảy ra?",
        options: [{ id: "A", text: "Enzyme tiêu hóa tràn ra ngoài và tự phân hủy chính tế bào đó" }, { id: "B", text: "Tế bào sẽ tạo ra nhiều năng lượng hơn" }, { id: "C", text: "Tế bào sẽ biến thành tế bào thực vật" }, { id: "D", text: "Tế bào không bị ảnh hưởng gì" }],
        correct: ["A"],
        explanation: "Lysosome chứa nhiều enzyme tiêu hóa mạnh; nếu màng vỡ, enzyme tràn ra sẽ phân hủy chính các bào quan của tế bào.",
      },
      {
        id: "q8",
        content: "Tế bào cơ tim đập liên tục cần nhiều năng lượng thì bào quan nào sẽ phát triển nhiều nhất?",
        options: [{ id: "A", text: "Ti thể" }, { id: "B", text: "Lysosome" }, { id: "C", text: "Trung thể" }, { id: "D", text: "Bộ máy Golgi" }],
        correct: ["A"],
        explanation: "Cơ tim cần lượng ATP khổng lồ để co bóp liên tục cả đời, vì vậy mỗi tế bào cơ tim chứa hàng nghìn ti thể.",
      },
      {
        id: "q9",
        content: "Ba thành phần cơ bản bắt buộc phải có ở mọi tế bào nhân thực gồm những gì?",
        options: [{ id: "A", text: "Màng tế bào, tế bào chất và nhân tế bào" }, { id: "B", text: "Thành cellulose, lục lạp và không bào lớn" }, { id: "C", text: "Vỏ nhầy, plasmid và roi vi khuẩn" }, { id: "D", text: "Chỉ cần màng tế bào và lông bám" }],
        correct: ["A"],
        explanation: "Ba thành phần cấu tạo cốt lõi của tế bào nhân thực (chuẩn SGK KHTN 6) là: Màng tế bào, Tế bào chất và Nhân tế bào.",
      },
      {
        id: "q10",
        content: "Vì sao trong mô hình 3D tế bào động vật, chúng ta KHÔNG vẽ thành tế bào cứng bằng cellulose và lục lạp?",
        options: [{ id: "A", text: "Vì thành cellulose và lục lạp chỉ có ở tế bào thực vật" }, { id: "B", text: "Vì tế bào động vật không đủ chỗ chứa" }, { id: "C", text: "Vì động vật không bao giờ cần năng lượng" }, { id: "D", text: "Vì tác giả quên không vẽ" }],
        correct: ["A"],
        explanation: "Thành cellulose cứng và lục lạp quang hợp là đặc trưng riêng của tế bào thực vật; tế bào động vật mềm dẻo và dị dưỡng.",
      },
    ],
  },
  'lo-xo-dan-hoi': {
    title: 'Bài 42: Biến dạng của lò xo',
    kind: 'lab',
    questions: [
      {
        id: "q1",
        content: "Trong các trường hợp sau, trường hợp nào xuất hiện hiện tượng biến dạng đàn hồi?",
        options: [{ id: "A", text: "Nặn một mẩu đất sét thành hình con gà" }, { id: "B", text: "Kéo dãn một lò xo vừa phải rồi thả tay ra, lò xo co lại về chiều dài ban đầu" }, { id: "C", text: "Uốn cong một sợi dây đồng dẻo" }, { id: "D", text: "Đập vỡ một chiếc cốc thuỷ tinh" }],
        correct: ["B"],
        explanation: "Chính xác! Lò xo có tính đàn hồi vì sau khi dãn hoặc nén trong giới hạn đàn hồi, nếu buông tay ra thì lò xo sẽ tự động trở về chiều dài và hình dạng ban đầu.",
      },
      {
        id: "q2",
        content: "Một lò xo có chiều dài tự nhiên ban đầu l₀ = 10 cm. Khi móc quả nặng vào lò xo 2 thì đo được chiều dài l = 13 cm. Độ dãn Δl của lò xo là:",
        options: [{ id: "A", text: "Δl = 23 cm" }, { id: "B", text: "Δl = 3 cm" }, { id: "C", text: "Δl = 13 cm" }, { id: "D", text: "Δl = 1.3 cm" }],
        correct: ["B"],
        explanation: "Đúng rồi! Độ dãn Δl = l - l₀ = 13 cm - 10 cm = 3 cm.",
      },
      {
        id: "q3",
        content: "Kết luận nào sau đây về độ dãn của lò xo treo thẳng đứng là đúng?",
        options: [{ id: "A", text: "Độ dãn của lò xo tỉ lệ nghịch với khối lượng quả nặng" }, { id: "B", text: "Độ dãn của lò xo tỉ lệ thuận với khối lượng quả nặng" }, { id: "C", text: "Khối lượng càng lớn thì lò xo dãn càng ít" }, { id: "D", text: "Độ dãn của lò xo không phụ thuộc vào trọng lượng của vật treo" }],
        correct: ["B"],
        explanation: "Chính xác! Thí nghiệm Bài 42 KHTN 6 chứng minh: Độ dãn của lò xo treo thẳng đứng tỉ lệ thuận với khối lượng của vật treo.",
      },
      {
        id: "q4",
        content: "Một lò xo có chiều dài ban đầu l₀ = 10 cm. Khi treo quả nặng 100 g thì chiều dài là 12 cm (dãn 2 cm). Hỏi khi treo quả nặng 200 g (gấp đôi) thì lò xo có chiều dài bao nhiêu?",
        options: [{ id: "A", text: "13 cm" }, { id: "B", text: "14 cm" }, { id: "C", text: "16 cm" }, { id: "D", text: "24 cm" }],
        correct: ["B"],
        explanation: "Rất giỏi! Khối lượng tăng gấp đôi (200g) thì độ dãn tăng gấp đôi: Δl₂ = 2 × 2 = 4 cm. Chiều dài mới của lò xo là l = 10 + 4 = 14 cm.",
      },
      {
        id: "q5",
        content: "Hãy sang tab Thí nghiệm ảo, nhấp vào \"Vật bí ẩn X\" trên bàn để móc vào Lò xo 2. Quan sát độ dãn trên mũi tên so sánh với Lò xo 1 đối chứng. Khối lượng của Vật X là bao nhiêu gam?",
        options: [],
        correct: ["75"],
        numeric: { value: 75, tolerance: 5 },
        explanation: "Tuyệt vời! Khối lượng chính xác của Vật bí ẩn X là 75 g. Khi treo vào Lò xo 2, vật X làm dãn 1.84 cm, đúng bằng 3/4 độ dãn của quả 100g.",
      },
    ],
  },
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
  'mach-dien-don-gian': {
    title: 'Bài 22: Mạch điện đơn giản',
    kind: 'lab',
    questions: [
      {
        id: "q1",
        content: "Kí hiệu nào sau đây biểu diễn BÓNG ĐÈN ĐIỆN trong sơ đồ mạch điện SGK?",
        options: [{ id: "A", text: "Pin (nguồn điện)" }, { id: "B", text: "Bóng đèn điện (hình tròn có dấu X)" }, { id: "C", text: "Công tắc đóng" }, { id: "D", text: "Ampe kế" }],
        correct: ["B"],
        explanation: "Bóng đèn điện được quy ước là một hình tròn có dấu gạch chéo (X) ở bên trong.",
      },
      {
        id: "q2",
        content: "Trong kí hiệu NGUỒN ĐIỆN (MỘT PIN), vạch dài và mỏng biểu thị cực gì?",
        options: [{ id: "A", text: "Cực âm (-)" }, { id: "B", text: "Cực dương (+)" }, { id: "C", text: "Dây nối đất" }, { id: "D", text: "Công tắc an toàn" }],
        correct: ["B"],
        explanation: "Theo quy ước quốc tế và SGK, vạch dài mảnh biểu thị cực dương (+), còn vạch ngắn dày biểu thị cực âm (-).",
      },
      {
        id: "q3",
        content: "Kí hiệu có cần gạt được nhấc lên nghiêng một góc biểu diễn thiết bị nào trong mạch điện?",
        options: [{ id: "A", text: "Cầu chì bảo vệ" }, { id: "B", text: "Công tắc đang mở (Khóa K mở)" }, { id: "C", text: "Công tắc đang đóng" }, { id: "D", text: "Điện trở" }],
        correct: ["B"],
        explanation: "Cần gạt được nhấc lên nghiêng một góc biểu thị công tắc đang mở, dòng điện bị ngắt tạo thành mạch hở.",
      },
      {
        id: "q4",
        content: "Dụng cụ nào có kí hiệu là hình tròn chứa chữ in hoa (A) và được mắc nối tiếp trong mạch?",
        options: [{ id: "A", text: "Vôn kế" }, { id: "B", text: "Ampe kế" }, { id: "C", text: "Điện trở kế" }, { id: "D", text: "Động cơ điện" }],
        correct: ["B"],
        explanation: "Ampe kế (A) dùng để đo cường độ dòng điện, có điện trở rất nhỏ và luôn được mắc nối tiếp trong mạch.",
      },
      {
        id: "q5",
        content: "Kí hiệu BỘ NGUỒN GỒM NHIỀU PIN MẮC NỐI TIẾP được vẽ như thế nào?",
        options: [{ id: "A", text: "Hình tròn có dấu X (bóng đèn)" }, { id: "B", text: "Hình tròn chứa chữ A (ampe kế)" }, { id: "C", text: "Các cặp vạch pin xen kẽ nối tiếp nhau (bộ pin)" }, { id: "D", text: "Cần gạt nhấc lên (công tắc mở)" }],
        correct: ["C"],
        explanation: "Bộ nguồn gồm nhiều pin được ghép từ các cặp vạch pin xen kẽ nối tiếp nhau (+ | i | i -).",
      },
      {
        id: "q6",
        content: "Hiện tượng ĐOẢN MẠCH (ngắn mạch) xảy ra khi nào trong mạch điện?",
        options: [{ id: "A", text: "Khi công tắc ngắt làm hở mạch" }, { id: "B", text: "Khi hai cực của nguồn điện bị nối trực tiếp bằng dây dẫn không qua điện trở/bóng đèn" }, { id: "C", text: "Khi bóng đèn bị cháy đứt dây tóc" }, { id: "D", text: "Khi mắc ampe kế nối tiếp với bóng đèn" }],
        correct: ["B"],
        explanation: "Theo Định luật Ôm (I = U / R), khi hai cực nguồn nối tắt trực tiếp thì R ≈ 0Ω, dòng điện I tăng vọt cực đại, tỏa nhiệt Jun-Len-xơ dữ dội làm nóng đỏ dây và gây hỏa hoạn.",
      },
      {
        id: "q7",
        content: "Thiết bị an toàn nào thường mắc nối tiếp ở đầu mạch để tự động ngắt dòng điện khi xảy ra đoản mạch?",
        options: [{ id: "A", text: "Cầu chì / Aptomat" }, { id: "B", text: "Vôn kế" }, { id: "C", text: "Bóng đèn phụ" }, { id: "D", text: "Biến trở con chạy" }],
        correct: ["A"],
        explanation: "Dây chì trong cầu chì có nhiệt độ nóng chảy thấp. Khi đoản mạch, dòng điện cực đại làm dây chì nóng chảy và đứt ngay lập tức, ngắt mạch kịp thời để bảo vệ nguồn và thiết bị.",
      },
      {
        id: "p1",
        content: "Sơ đồ 1: gồm 1 pin, 1 công tắc đang mở (K mở) và 1 bóng đèn điện. Khi cho dòng điện chạy qua, bóng đèn sẽ sáng hay không sáng?",
        options: [{ id: "lit", text: "Bóng đèn sẽ SÁNG" }, { id: "unlit", text: "Bóng đèn KHÔNG SÁNG" }],
        correct: ["unlit"],
        explanation: "Vì công tắc K đang mở nên mạch bị hở giữa hai chốt của khóa K. Dòng điện không thể chạy qua không khí, do đó bóng đèn KHÔNG SÁNG.",
      },
      {
        id: "p2",
        content: "Sơ đồ 2: gồm 1 pin, 1 công tắc đã đóng (K đóng), 1 bóng đèn điện, dây dẫn liên tục. Bóng đèn sẽ sáng hay không sáng?",
        options: [{ id: "lit", text: "Bóng đèn sẽ SÁNG" }, { id: "unlit", text: "Bóng đèn KHÔNG SÁNG" }],
        correct: ["lit"],
        explanation: "Công tắc K đã đóng tạo thành một đường dẫn điện khép kín từ cực dương qua công tắc, qua bóng đèn về cực âm. Dòng điện chạy liên tục và bóng đèn PHÁT SÁNG.",
      },
      {
        id: "p3",
        content: "Sơ đồ 3: gồm bộ 2 pin, 1 công tắc đóng, 2 bóng đèn mắc nối tiếp nhau và 1 ampe kế. Các bóng đèn sẽ sáng hay không sáng?",
        options: [{ id: "lit", text: "Bóng đèn sẽ SÁNG" }, { id: "unlit", text: "Bóng đèn KHÔNG SÁNG" }],
        correct: ["lit"],
        explanation: "Mạch kín hoàn chỉnh có dòng điện I chạy qua cả hai đèn. Vì mắc nối tiếp nên cường độ dòng điện bằng nhau tại mọi điểm: I = I₁ = I₂. Cả hai đèn đều sáng!",
      },
      {
        id: "p4",
        content: "Sơ đồ 4: 1 pin 1,5V nối thẳng vào 2 cực của khóa K đang đóng, KHÔNG có bóng đèn. Mạch này có sáng đèn không, và có an toàn không?",
        options: [{ id: "lit", text: "Bóng đèn sẽ SÁNG" }, { id: "unlit", text: "Bóng đèn KHÔNG SÁNG" }],
        correct: ["unlit"],
        explanation: "ĐÂY LÀ ĐOẢN MẠCH NGUY HIỂM! Do không có điện trở tải (R = 0Ω), dòng điện tăng vọt cực đại làm pin cạn kiệt nhanh chóng và dây dẫn phát hỏa bốc cháy. Tuyệt đối không được đấu nối!",
      },
      {
        id: "p5",
        content: "Sơ đồ 5: hai bóng đèn mắc nối tiếp nhưng hai đầu Đèn 1 có một đoạn dây dẫn nối tắt. Mạch có bóng đèn sáng hay không?",
        options: [{ id: "lit", text: "Bóng đèn sẽ SÁNG" }, { id: "unlit", text: "Bóng đèn KHÔNG SÁNG" }],
        correct: ["lit"],
        explanation: "Đèn 1 bị nối tắt nên dòng điện chỉ chạy qua sợi dây bypass (điện trở gần như bằng 0) mà không qua đèn 1: Đèn 1 TẮT. Đèn 2 nhận toàn bộ hiệu điện thế nguồn nên SÁNG RỰC RỠ!",
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
  if (question.numeric) {
    const n = parseFloat(String(answer ?? '').replace(',', '.'));
    return !Number.isNaN(n) && Math.abs(n - question.numeric.value) <= question.numeric.tolerance;
  }
  const chosen = (Array.isArray(answer) ? answer : [answer]).map((v) => String(v)).sort();
  const correct = [...question.correct].sort();
  return chosen.length === correct.length && chosen.every((v, i) => v === correct[i]);
}
