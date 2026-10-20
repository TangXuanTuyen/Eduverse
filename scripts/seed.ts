/**
 * Seed dữ liệu giả cho môi trường DEV (Supabase Cloud project dành riêng cho dev).
 *   npm run seed            — tạo dữ liệu nếu chưa có
 *   npm run seed -- --force — xóa dữ liệu cũ và tạo lại
 *
 * Toàn bộ người là giả. Không dùng cho môi trường thật.
 */
import { writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

process.loadEnvFile?.('.env.local');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local');
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const USERS = [
  { key: 'gv1', email: 'gv.lan.eduverse@example.com', role: 'teacher' as const, name: 'Cô Nguyễn Thị Lan (giả)' },
  { key: 'gv2', email: 'gv.minh.eduverse@example.com', role: 'teacher' as const, name: 'Thầy Trần Văn Minh (giả)' },
  { key: 'ph1', email: 'ph.hoa.eduverse@example.com', role: 'parent' as const, name: 'Phụ huynh Lê Thị Hoa (giả)' },
  { key: 'ph2', email: 'ph.tuan.eduverse@example.com', role: 'parent' as const, name: 'Phụ huynh Phạm Văn Tuấn (giả)' },
  ...Array.from({ length: 10 }, (_, i) => ({
    key: `hs${i + 1}`,
    email: `hs${i + 1}.eduverse@example.com`,
    role: 'student' as const,
    name: [
      'Nguyễn Minh An', 'Trần Gia Bảo', 'Lê Ngọc Chi', 'Phạm Đức Dũng', 'Hoàng Thu Hà',
      'Vũ Quang Huy', 'Đặng Bảo Khánh', 'Bùi Thanh Lam', 'Đỗ Hải Nam', 'Ngô Phương Thảo',
    ][i] + ' (giả)',
  })),
];

// ---------- KHTN Lớp 6 — Chương "Lực và chuyển động" ----------

const QUESTIONS: Array<{
  type: 'single_choice' | 'multiple_choice' | 'short_answer';
  content: string;
  options: Array<{ id: string; text: string }> | null;
  correct_answer: string | string[];
  difficulty: 1 | 2 | 3;
  skill_tags: string[];
  explanation: string;
}> = [
  // --- Dễ (20 câu) ---
  { type: 'single_choice', content: 'Đơn vị đo lực trong hệ SI là gì?', options: [{ id: 'a', text: 'Newton (N)' }, { id: 'b', text: 'Kilogram (kg)' }, { id: 'c', text: 'Mét (m)' }, { id: 'd', text: 'Giây (s)' }], correct_answer: 'a', difficulty: 1, skill_tags: ['luc', 'don-vi'], explanation: 'Đơn vị đo lực trong hệ SI là Newton (N), đặt theo tên nhà vật lý Isaac Newton.' },
  { type: 'single_choice', content: 'Dụng cụ nào dùng để đo lực?', options: [{ id: 'a', text: 'Cân điện tử' }, { id: 'b', text: 'Lực kế' }, { id: 'c', text: 'Thước kẻ' }, { id: 'd', text: 'Nhiệt kế' }], correct_answer: 'b', difficulty: 1, skill_tags: ['luc', 'dung-cu'], explanation: 'Lực kế là dụng cụ chuyên dùng để đo lực.' },
  { type: 'single_choice', content: 'Trọng lực có phương nào?', options: [{ id: 'a', text: 'Ngang' }, { id: 'b', text: 'Thẳng đứng' }, { id: 'c', text: 'Xiên' }, { id: 'd', text: 'Bất kỳ' }], correct_answer: 'b', difficulty: 1, skill_tags: ['trong-luc', 'phuong-chieu'], explanation: 'Trọng lực luôn hướng xuống theo phương thẳng đứng.' },
  { type: 'single_choice', content: 'Lực ma sát xuất hiện khi nào?', options: [{ id: 'a', text: 'Vật đứng yên trên mặt phẳng nghiêng' }, { id: 'b', text: 'Hai bề mặt tiếp xúc có xu hướng trượt' }, { id: 'c', text: 'Cả A và B' }, { id: 'd', text: 'Vật rơi tự do trong chân không' }], correct_answer: 'c', difficulty: 1, skill_tags: ['ma-sat', 'luc'], explanation: 'Lực ma sát xuất hiện khi hai bề mặt tiếp xúc có xu hướng chuyển động tương đối.' },
  { type: 'short_answer', content: 'Lực là gì? Trả lời bằng một câu ngắn.', options: null, correct_answer: ['tác dụng đẩy hoặc kéo', 'tác dụng của vật này lên vật khác', 'đẩy hoặc kéo'], difficulty: 1, skill_tags: ['luc', 'khai-niem'], explanation: 'Lực là tác dụng đẩy hoặc kéo của vật này lên vật khác.' },
  { type: 'single_choice', content: 'Khi quả bóng lăn trên sân, lực nào làm nó chậm dần?', options: [{ id: 'a', text: 'Trọng lực' }, { id: 'b', text: 'Lực ma sát' }, { id: 'c', text: 'Lực đàn hồi' }, { id: 'd', text: 'Lực hút' }], correct_answer: 'b', difficulty: 1, skill_tags: ['ma-sat', 'chuyen-dong'], explanation: 'Lực ma sát giữa bóng và sân cản trở chuyển động, làm bóng chậm dần.' },
  { type: 'single_choice', content: 'Vật nào đang chịu tác dụng của lực đàn hồi?', options: [{ id: 'a', text: 'Lò xo bị nén' }, { id: 'b', text: 'Hòn đá nằm trên bàn' }, { id: 'c', text: 'Quả táo rơi' }, { id: 'd', text: 'Nước chảy trong ống' }], correct_answer: 'a', difficulty: 1, skill_tags: ['dan-hoi', 'luc'], explanation: 'Lò xo bị nén hoặc kéo dãn sẽ sinh ra lực đàn hồi.' },
  { type: 'single_choice', content: 'Trọng lượng của vật có khối lượng 1 kg xấp xỉ bao nhiêu?', options: [{ id: 'a', text: '1 N' }, { id: 'b', text: '10 N' }, { id: 'c', text: '100 N' }, { id: 'd', text: '1000 N' }], correct_answer: 'b', difficulty: 1, skill_tags: ['trong-luc', 'tinh-toan'], explanation: 'Trọng lượng P = m × g ≈ 1 × 10 = 10 N.' },
  { type: 'single_choice', content: 'Tốc độ được đo bằng đơn vị nào?', options: [{ id: 'a', text: 'N (Newton)' }, { id: 'b', text: 'm/s' }, { id: 'c', text: 'kg' }, { id: 'd', text: 'J (Joule)' }], correct_answer: 'b', difficulty: 1, skill_tags: ['toc-do', 'don-vi'], explanation: 'Tốc độ = quãng đường / thời gian, đơn vị m/s.' },
  { type: 'single_choice', content: 'Chuyển động nào là chuyển động đều?', options: [{ id: 'a', text: 'Xe lao dốc' }, { id: 'b', text: 'Kim giây đồng hồ' }, { id: 'c', text: 'Quả bóng bị đá' }, { id: 'd', text: 'Lá rơi' }], correct_answer: 'b', difficulty: 1, skill_tags: ['chuyen-dong', 'deu'], explanation: 'Kim giây quay đều, tốc độ không đổi.' },
  { type: 'short_answer', content: 'Nêu 2 ví dụ về lực ma sát có ích.', options: null, correct_answer: ['phanh xe', 'đi bộ', 'cầm bút', 'giày ma sát'], difficulty: 1, skill_tags: ['ma-sat', 'ung-dung'], explanation: 'Phanh xe dừng nhờ ma sát; chân bám đường nhờ ma sát.' },
  { type: 'single_choice', content: 'Lực nào giữ cho sách nằm yên trên bàn?', options: [{ id: 'a', text: 'Lực đẩy' }, { id: 'b', text: 'Phản lực (lực pháp tuyến)' }, { id: 'c', text: 'Lực hút nam châm' }, { id: 'd', text: 'Lực ly tâm' }], correct_answer: 'b', difficulty: 1, skill_tags: ['phan-luc', 'can-bang'], explanation: 'Mặt bàn tác dụng phản lực lên sách, cân bằng với trọng lực.' },
  { type: 'single_choice', content: 'Khi ném bóng lên cao, lực nào kéo bóng xuống?', options: [{ id: 'a', text: 'Lực ném' }, { id: 'b', text: 'Trọng lực' }, { id: 'c', text: 'Lực đàn hồi' }, { id: 'd', text: 'Lực ma sát' }], correct_answer: 'b', difficulty: 1, skill_tags: ['trong-luc', 'roi-tu-do'], explanation: 'Trọng lực (lực hấp dẫn của Trái Đất) kéo bóng xuống.' },
  { type: 'single_choice', content: 'Vật chuyển động nhanh hơn có tốc độ thế nào?', options: [{ id: 'a', text: 'Nhỏ hơn' }, { id: 'b', text: 'Lớn hơn' }, { id: 'c', text: 'Bằng nhau' }, { id: 'd', text: 'Không xác định' }], correct_answer: 'b', difficulty: 1, skill_tags: ['toc-do', 'so-sanh'], explanation: 'Tốc độ lớn hơn nghĩa là vật đi được quãng đường dài hơn trong cùng thời gian.' },
  { type: 'single_choice', content: 'Lực nào KHÔNG phải lực tiếp xúc?', options: [{ id: 'a', text: 'Lực ma sát' }, { id: 'b', text: 'Lực đàn hồi' }, { id: 'c', text: 'Trọng lực' }, { id: 'd', text: 'Lực đẩy tay' }], correct_answer: 'c', difficulty: 1, skill_tags: ['luc', 'phan-loai'], explanation: 'Trọng lực tác dụng từ xa (không cần tiếp xúc).' },
  // --- Trung bình (15 câu) ---
  { type: 'single_choice', content: 'Một vật 5 kg đặt trên mặt bàn. Trọng lượng của vật là bao nhiêu?', options: [{ id: 'a', text: '5 N' }, { id: 'b', text: '50 N' }, { id: 'c', text: '500 N' }, { id: 'd', text: '0,5 N' }], correct_answer: 'b', difficulty: 2, skill_tags: ['trong-luc', 'tinh-toan'], explanation: 'P = m × g = 5 × 10 = 50 N.' },
  { type: 'single_choice', content: 'Xe đạp đi 12 km trong 30 phút. Tốc độ trung bình là?', options: [{ id: 'a', text: '24 km/h' }, { id: 'b', text: '6 km/h' }, { id: 'c', text: '12 km/h' }, { id: 'd', text: '40 km/h' }], correct_answer: 'a', difficulty: 2, skill_tags: ['toc-do', 'tinh-toan'], explanation: 'v = s/t = 12 / 0,5 = 24 km/h.' },
  { type: 'multiple_choice', content: 'Lực nào sau đây là lực không tiếp xúc? (Chọn tất cả đúng)', options: [{ id: 'a', text: 'Trọng lực' }, { id: 'b', text: 'Lực hút nam châm' }, { id: 'c', text: 'Lực ma sát' }, { id: 'd', text: 'Lực tĩnh điện' }], correct_answer: ['a', 'b', 'd'], difficulty: 2, skill_tags: ['luc', 'phan-loai'], explanation: 'Trọng lực, lực từ, lực tĩnh điện đều tác dụng từ xa.' },
  { type: 'single_choice', content: 'Cách nào KHÔNG giảm ma sát?', options: [{ id: 'a', text: 'Tra dầu' }, { id: 'b', text: 'Dùng ổ bi' }, { id: 'c', text: 'Tăng độ nhám' }, { id: 'd', text: 'Dùng bánh xe' }], correct_answer: 'c', difficulty: 2, skill_tags: ['ma-sat', 'giam-ma-sat'], explanation: 'Tăng độ nhám làm tăng ma sát, không giảm.' },
  { type: 'short_answer', content: 'Công thức tính tốc độ trung bình là gì?', options: null, correct_answer: ['v = s/t', 'v=s/t', 's/t'], difficulty: 2, skill_tags: ['toc-do', 'cong-thuc'], explanation: 'Tốc độ trung bình v = quãng đường s / thời gian t.' },
  { type: 'single_choice', content: 'Hai lực cân bằng có đặc điểm gì?', options: [{ id: 'a', text: 'Cùng phương, cùng chiều, cùng độ lớn' }, { id: 'b', text: 'Cùng phương, ngược chiều, cùng độ lớn' }, { id: 'c', text: 'Khác phương, cùng độ lớn' }, { id: 'd', text: 'Cùng chiều, khác độ lớn' }], correct_answer: 'b', difficulty: 2, skill_tags: ['luc', 'can-bang'], explanation: 'Hai lực cân bằng: cùng phương, ngược chiều, cùng độ lớn, tác dụng lên cùng vật.' },
  { type: 'single_choice', content: 'Khi kéo hộp trên sàn nhà, lực ma sát trượt phụ thuộc vào yếu tố nào?', options: [{ id: 'a', text: 'Tốc độ kéo' }, { id: 'b', text: 'Diện tích tiếp xúc' }, { id: 'c', text: 'Lực ép và bề mặt tiếp xúc' }, { id: 'd', text: 'Hình dạng vật' }], correct_answer: 'c', difficulty: 2, skill_tags: ['ma-sat', 'yeu-to'], explanation: 'Ma sát trượt phụ thuộc vào lực ép (trọng lượng) và tính chất bề mặt.' },
  { type: 'single_choice', content: 'Vật nào chuyển động không đều?', options: [{ id: 'a', text: 'Đầu kim đồng hồ' }, { id: 'b', text: 'Ô tô tăng tốc' }, { id: 'c', text: 'Tàu chạy 80 km/h suốt hành trình' }, { id: 'd', text: 'Quạt quay đều' }], correct_answer: 'b', difficulty: 2, skill_tags: ['chuyen-dong', 'khong-deu'], explanation: 'Ô tô tăng tốc → tốc độ thay đổi → chuyển động không đều.' },
  { type: 'single_choice', content: 'Một người đi bộ 1,5 km trong 20 phút. Tốc độ trung bình (m/s)?', options: [{ id: 'a', text: '0,75 m/s' }, { id: 'b', text: '1,25 m/s' }, { id: 'c', text: '4,5 m/s' }, { id: 'd', text: '75 m/s' }], correct_answer: 'b', difficulty: 2, skill_tags: ['toc-do', 'doi-don-vi'], explanation: 'v = 1500m / 1200s = 1,25 m/s.' },
  { type: 'single_choice', content: 'Lực đàn hồi của lò xo tỉ lệ với gì?', options: [{ id: 'a', text: 'Khối lượng lò xo' }, { id: 'b', text: 'Độ biến dạng' }, { id: 'c', text: 'Nhiệt độ' }, { id: 'd', text: 'Thời gian nén' }], correct_answer: 'b', difficulty: 2, skill_tags: ['dan-hoi', 'ti-le'], explanation: 'Lực đàn hồi F = k × Δl, tỉ lệ thuận với độ biến dạng.' },
  { type: 'multiple_choice', content: 'Chọn các phát biểu đúng về lực ma sát:', options: [{ id: 'a', text: 'Luôn cản trở chuyển động' }, { id: 'b', text: 'Có thể có ích hoặc có hại' }, { id: 'c', text: 'Phụ thuộc vào bề mặt tiếp xúc' }, { id: 'd', text: 'Chỉ xuất hiện khi vật chuyển động' }], correct_answer: ['b', 'c'], difficulty: 2, skill_tags: ['ma-sat', 'tinh-chat'], explanation: 'Ma sát có ích (đi bộ) và có hại (mòn xe). Ma sát nghỉ xuất hiện cả khi vật đứng yên.' },
  { type: 'single_choice', content: 'Biểu diễn lực bằng một mũi tên. Độ dài mũi tên thể hiện gì?', options: [{ id: 'a', text: 'Phương của lực' }, { id: 'b', text: 'Chiều của lực' }, { id: 'c', text: 'Độ lớn của lực' }, { id: 'd', text: 'Điểm đặt của lực' }], correct_answer: 'c', difficulty: 2, skill_tags: ['luc', 'bieu-dien'], explanation: 'Độ dài mũi tên tỉ lệ với độ lớn (cường độ) của lực.' },
  { type: 'single_choice', content: 'Quán tính là gì?', options: [{ id: 'a', text: 'Xu hướng vật giữ nguyên trạng thái chuyển động' }, { id: 'b', text: 'Lực tác dụng lên vật' }, { id: 'c', text: 'Năng lượng của vật' }, { id: 'd', text: 'Gia tốc của vật' }], correct_answer: 'a', difficulty: 2, skill_tags: ['quan-tinh', 'khai-niem'], explanation: 'Quán tính: vật có xu hướng giữ nguyên trạng thái đứng yên hoặc chuyển động thẳng đều.' },
  { type: 'single_choice', content: 'Tại sao khi phanh gấp, người ngồi trên xe bị lao về phía trước?', options: [{ id: 'a', text: 'Do trọng lực' }, { id: 'b', text: 'Do quán tính' }, { id: 'c', text: 'Do lực đẩy' }, { id: 'd', text: 'Do lực ly tâm' }], correct_answer: 'b', difficulty: 2, skill_tags: ['quan-tinh', 'ung-dung'], explanation: 'Do quán tính, người vẫn tiếp tục chuyển động về phía trước khi xe dừng đột ngột.' },
  // --- Khó (10 câu) ---
  { type: 'single_choice', content: 'Một xe máy chạy 60 km/h. Đổi sang m/s được bao nhiêu?', options: [{ id: 'a', text: '10 m/s' }, { id: 'b', text: '16,67 m/s' }, { id: 'c', text: '20 m/s' }, { id: 'd', text: '6 m/s' }], correct_answer: 'b', difficulty: 3, skill_tags: ['toc-do', 'doi-don-vi'], explanation: '60 km/h = 60 × 1000 / 3600 ≈ 16,67 m/s.' },
  { type: 'single_choice', content: 'Vật 2 kg treo trên 2 sợi dây. Mỗi dây chịu lực căng bao nhiêu (bỏ qua khối lượng dây, 2 dây đối xứng thẳng đứng)?', options: [{ id: 'a', text: '10 N' }, { id: 'b', text: '20 N' }, { id: 'c', text: '5 N' }, { id: 'd', text: '40 N' }], correct_answer: 'a', difficulty: 3, skill_tags: ['luc', 'can-bang', 'tinh-toan'], explanation: 'P = 20 N, chia đều 2 dây → mỗi dây 10 N.' },
  { type: 'short_answer', content: 'Một người đi xe đạp 2 km trong 5 phút, rồi nghỉ 3 phút, rồi đi tiếp 4 km trong 10 phút. Tính tốc độ trung bình (km/h).', options: null, correct_answer: ['20', '20 km/h'], difficulty: 3, skill_tags: ['toc-do', 'tinh-toan', 'trung-binh'], explanation: 'v = tổng quãng đường / tổng thời gian = 6 / (18/60) = 6 / 0,3 = 20 km/h.' },
  { type: 'single_choice', content: 'Trên mặt trăng (g ≈ 1,6 m/s²), trọng lượng vật 10 kg là?', options: [{ id: 'a', text: '16 N' }, { id: 'b', text: '100 N' }, { id: 'c', text: '10 N' }, { id: 'd', text: '160 N' }], correct_answer: 'a', difficulty: 3, skill_tags: ['trong-luc', 'mat-trang'], explanation: 'P = m × g = 10 × 1,6 = 16 N.' },
  { type: 'multiple_choice', content: 'Khi ô tô đang chạy với tốc độ không đổi trên đường thẳng, những phát biểu nào đúng?', options: [{ id: 'a', text: 'Hợp lực bằng 0' }, { id: 'b', text: 'Không có lực nào tác dụng' }, { id: 'c', text: 'Lực kéo = lực ma sát' }, { id: 'd', text: 'Ô tô chuyển động đều' }], correct_answer: ['a', 'c', 'd'], difficulty: 3, skill_tags: ['luc', 'can-bang', 'chuyen-dong-deu'], explanation: 'Chuyển động thẳng đều → hợp lực = 0, lực kéo cân bằng ma sát.' },
  { type: 'single_choice', content: 'Tại sao ô tô đua có lốp rộng và có rãnh?', options: [{ id: 'a', text: 'Để đẹp' }, { id: 'b', text: 'Rãnh thoát nước tăng ma sát, lốp rộng phân bố lực' }, { id: 'c', text: 'Để giảm ma sát' }, { id: 'd', text: 'Để chạy êm hơn' }], correct_answer: 'b', difficulty: 3, skill_tags: ['ma-sat', 'ung-dung-thuc-te'], explanation: 'Rãnh giúp thoát nước, tăng tiếp xúc trực tiếp với đường → tăng ma sát bám.' },
  { type: 'single_choice', content: 'Lò xo có độ cứng k = 100 N/m bị kéo dãn 5 cm. Lực đàn hồi là?', options: [{ id: 'a', text: '5 N' }, { id: 'b', text: '500 N' }, { id: 'c', text: '50 N' }, { id: 'd', text: '0,5 N' }], correct_answer: 'a', difficulty: 3, skill_tags: ['dan-hoi', 'tinh-toan'], explanation: 'F = k × Δl = 100 × 0,05 = 5 N.' },
  { type: 'single_choice', content: 'Hai vật A (3 kg) và B (5 kg) nối bằng dây qua ròng rọc cố định (bỏ qua ma sát). Vật nào chuyển động xuống?', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }, { id: 'c', text: 'Cả hai đứng yên' }, { id: 'd', text: 'Không xác định' }], correct_answer: 'b', difficulty: 3, skill_tags: ['luc', 'rong-roc', 'trong-luc'], explanation: 'Vật B nặng hơn → trọng lực B lớn hơn → B đi xuống, A đi lên.' },
  { type: 'short_answer', content: 'Vật 500 g rơi tự do. Tính trọng lực tác dụng lên vật (g = 10 m/s²).', options: null, correct_answer: ['5 N', '5N', '5'], difficulty: 3, skill_tags: ['trong-luc', 'doi-don-vi', 'tinh-toan'], explanation: 'P = m × g = 0,5 × 10 = 5 N. Chú ý: 500 g = 0,5 kg.' },
  { type: 'single_choice', content: 'Phi hành gia trên ISS cảm thấy "không trọng lượng" vì:', options: [{ id: 'a', text: 'Không có trọng lực' }, { id: 'b', text: 'ISS rơi tự do quanh Trái Đất' }, { id: 'c', text: 'ISS quá xa Trái Đất' }, { id: 'd', text: 'Không có không khí' }], correct_answer: 'b', difficulty: 3, skill_tags: ['trong-luc', 'roi-tu-do', 'vu-tru'], explanation: 'ISS và phi hành gia cùng rơi tự do (bay quanh Trái Đất), nên không có phản lực → cảm giác không trọng lượng.' },
];

const BADGES = [
  { id: 'first-login', name: 'Bước đầu', description: 'Đăng nhập lần đầu', icon: '🌟', category: 'progress', xp_reward: 10, sort_order: 1 },
  { id: 'quiz-10', name: 'Chiến binh 10', description: 'Hoàn thành 10 câu hỏi', icon: '⚔️', category: 'effort', xp_reward: 20, sort_order: 2 },
  { id: 'streak-3', name: 'Đều đặn 3 ngày', description: 'Học 3 ngày liên tiếp', icon: '🔥', category: 'effort', xp_reward: 30, sort_order: 3 },
  { id: 'review-5', name: 'Sửa sai 5', description: 'Sửa 5 lỗi ở Trạm sửa lỗi', icon: '🔧', category: 'learning', xp_reward: 25, sort_order: 4 },
  { id: 'boss-1', name: 'Hạ trùm đầu', description: 'Thắng trận Boss đầu tiên', icon: '👑', category: 'mastery', xp_reward: 50, sort_order: 5 },
  { id: 'perfect-score', name: 'Điểm tuyệt đối', description: 'Đạt 100% bài kiểm tra', icon: '💯', category: 'mastery', xp_reward: 40, sort_order: 6 },
];

async function ensureUser(email: string, name: string, role: string) {
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list?.users.find((u) => u.email === email);
  if (existing) return existing.id;

  const password = 'SeedPass' + Math.random().toString(36).slice(2, 10);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (error) throw error;

  await admin.from('profiles').update({ role, display_name: name, grade: role === 'student' ? 6 : null }).eq('id', data.user.id);
  return data.user.id;
}

async function main() {
  console.log('=== Seed EDUVERSE ===\n');

  // 1. Users
  console.log('1. Tạo người dùng...');
  const ids: Record<string, string> = {};
  for (const u of USERS) {
    ids[u.key] = await ensureUser(u.email, u.name, u.role);
    console.log(`  ${u.role.padEnd(8)} ${u.name}`);
  }

  // 2. Room
  console.log('\n2. Tạo phòng...');
  let { data: room } = await admin
    .from('rooms')
    .select('id, join_code')
    .eq('owner_id', ids.gv1)
    .eq('name', 'KHTN 6A1')
    .maybeSingle();

  if (!room) {
    const { data: code } = await admin.rpc('generate_join_code');
    const { data, error } = await admin
      .from('rooms')
      .insert({
        name: 'KHTN 6A1',
        subject: 'KHTN',
        grade: 6,
        owner_id: ids.gv1,
        join_code: code,
        join_code_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id, join_code')
      .single();
    if (error) throw error;
    room = data;
  }
  console.log(`  Phòng "KHTN 6A1" — mã: ${room!.join_code}`);

  const members = [
    { room_id: room!.id, user_id: ids.gv1 },
    ...Array.from({ length: 10 }, (_, i) => ({ room_id: room!.id, user_id: ids[`hs${i + 1}`] })),
  ];
  await admin.from('room_members').upsert(members, { onConflict: 'room_id,user_id' });

  // 3. Parent links
  console.log('\n3. Liên kết phụ huynh...');
  await admin.from('parent_links').upsert(
    [
      { parent_id: ids.ph1, student_id: ids.hs1, status: 'approved', decided_by: ids.gv1, decided_at: new Date().toISOString() },
      { parent_id: ids.ph1, student_id: ids.hs3, status: 'approved', decided_by: ids.gv1, decided_at: new Date().toISOString() },
      { parent_id: ids.ph2, student_id: ids.hs2, status: 'approved', decided_by: ids.gv1, decided_at: new Date().toISOString() },
    ],
    { onConflict: 'parent_id,student_id' }
  );
  console.log('  PH Hoa → HS An, Chi | PH Tuấn → HS Bảo');

  // 4. Questions + answers
  console.log('\n4. Tạo ngân hàng câu hỏi (KHTN 6 — Lực và chuyển động)...');
  const questionIds: string[] = [];
  for (const q of QUESTIONS) {
    const { data: existing } = await admin
      .from('questions')
      .select('id')
      .eq('owner_id', ids.gv1)
      .eq('content', q.content)
      .maybeSingle();

    if (existing) {
      questionIds.push(existing.id);
      continue;
    }

    const { data: qData, error: qErr } = await admin
      .from('questions')
      .insert({
        owner_id: ids.gv1,
        type: q.type,
        content: q.content,
        options: q.options,
        skill_tags: q.skill_tags,
        difficulty: q.difficulty,
        explanation: q.explanation,
      })
      .select('id')
      .single();
    if (qErr) throw qErr;
    questionIds.push(qData.id);

    await admin.from('question_answers').upsert({
      question_id: qData.id,
      correct_answer: q.correct_answer,
    }, { onConflict: 'question_id' });
  }
  console.log(`  ${questionIds.length} câu hỏi (${QUESTIONS.filter(q => q.difficulty === 1).length} dễ, ${QUESTIONS.filter(q => q.difficulty === 2).length} TB, ${QUESTIONS.filter(q => q.difficulty === 3).length} khó)`);

  // 5. Assignment
  console.log('\n5. Tạo bài giao...');
  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const assignments = [
    { title: 'Bài kiểm tra: Lực và chuyển động', description: 'Trắc nghiệm 15 câu, 30 phút.', due: in3Days, questionCount: 15 },
    { title: 'Ôn tập: Trọng lực và ma sát', description: 'Bài tập ôn tập chương 2.', due: in3Days, questionCount: 10 },
    { title: 'Bài tập về nhà: Tốc độ', description: 'Tính tốc độ trung bình, đổi đơn vị.', due: yesterday, questionCount: 8 },
  ];

  for (const a of assignments) {
    const { data: existing } = await admin
      .from('assignments')
      .select('id')
      .eq('room_id', room!.id)
      .eq('title', a.title)
      .maybeSingle();
    if (existing) continue;

    const { data: aData, error: aErr } = await admin
      .from('assignments')
      .insert({
        room_id: room!.id,
        created_by: ids.gv1,
        title: a.title,
        description: a.description,
        due_at: a.due.toISOString(),
      })
      .select('id')
      .single();
    if (aErr) throw aErr;

    const aqData = questionIds.slice(0, a.questionCount).map((qid, idx) => ({
      assignment_id: aData.id,
      question_id: qid,
      sort_order: idx,
    }));
    await admin.from('assignment_questions').upsert(aqData, { onConflict: 'assignment_id,question_id' });
  }
  console.log(`  ${assignments.length} bài giao`);

  // 6. Badges
  console.log('\n6. Tạo huy hiệu...');
  await admin.from('badges').upsert(BADGES, { onConflict: 'id' });
  console.log(`  ${BADGES.length} huy hiệu`);

  // 7. XP + stats + badge awards cho học sinh
  console.log('\n7. Tạo dữ liệu hoạt động giả...');
  for (let i = 0; i < 10; i++) {
    const sid = ids[`hs${i + 1}`];
    const xpBase = 50 + Math.floor(Math.random() * 200);
    const streak = Math.floor(Math.random() * 7);

    await admin.from('student_stats').upsert({
      student_id: sid,
      total_xp: xpBase,
      xp_today: Math.min(xpBase, 30),
      xp_today_date: now.toISOString().slice(0, 10),
      current_level: Math.floor(xpBase / 100) + 1,
      reviews_fixed: Math.floor(Math.random() * 10),
      games_completed: Math.floor(Math.random() * 8),
      current_daily_streak: streak,
      longest_daily_streak: streak + Math.floor(Math.random() * 3),
    }, { onConflict: 'student_id' });

    // XP transactions
    const reasons = ['quiz_complete', 'boss_victory', 'review_fixed', 'daily_login'];
    for (let j = 0; j < 3 + Math.floor(Math.random() * 5); j++) {
      const reason = reasons[j % reasons.length];
      const key = `seed-${sid.slice(0, 8)}-${reason}-${j}`;
      await admin.from('xp_transactions').upsert({
        student_id: sid,
        amount: 10 + Math.floor(Math.random() * 30),
        reason,
        idempotency_key: key,
        metadata: {},
      }, { onConflict: 'student_id,idempotency_key' });
    }

    // Badge awards (first few students get badges)
    if (i < 5) {
      const badgesToAward = BADGES.slice(0, 2 + Math.floor(Math.random() * 3));
      for (const b of badgesToAward) {
        await admin.from('badge_awards').upsert({
          student_id: sid,
          badge_id: b.id,
        }, { onConflict: 'student_id,badge_id' });
      }
    }
  }
  console.log('  10 học sinh có XP, stats, huy hiệu');

  // 8. AI room settings
  console.log('\n8. Cài đặt AI cho phòng...');
  await admin.from('ai_room_settings').upsert({
    room_id: room!.id,
    ai_enabled: true,
    daily_limit_per_student: 30,
  }, { onConflict: 'room_id' });
  console.log('  AI bật cho KHTN 6A1, 30 lượt/ngày');

  // Write credentials
  const lines = [
    '# Tài khoản seed (DEV)',
    '',
    `Tạo lúc: ${new Date().toISOString()}`,
    '',
    `Phòng "KHTN 6A1" — mã vào: ${room!.join_code}`,
    '',
    '## Người dùng',
    ...USERS.map((u) => `- ${u.role}: ${u.email} — ${u.name}`),
    '',
    `## Câu hỏi: ${QUESTIONS.length} câu (Lực và chuyển động, lớp 6)`,
    `## Bài giao: ${assignments.length} bài`,
    `## Huy hiệu: ${BADGES.length}`,
    '',
    'Đăng nhập bằng Google với các email trên.',
    '',
  ];
  writeFileSync('.seed-credentials.local.md', lines.join('\n'), { mode: 0o600 });
  console.log('\n✓ Seed xong! Xem .seed-credentials.local.md');
}

main().catch((e) => {
  console.error('Seed thất bại:', e instanceof Error ? e.message : e);
  process.exit(1);
});
