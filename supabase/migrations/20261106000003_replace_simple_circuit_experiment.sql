-- Thay bài "Thí nghiệm lắp mạch điện đơn giản" bằng bản mới (Khối 8).
-- Cập nhật tại chỗ để các bài đã giao cho lớp vẫn trỏ đúng thí nghiệm.
UPDATE public.experiments
SET
  title = 'Bài 22: Mạch điện đơn giản',
  description = 'Bài 22 · Chương V: Điện — Kéo thả pin, bóng đèn, công tắc, dây dẫn để lắp mạch điện nối tiếp, đo ampe kế và vôn kế, làm hoạt động nhận biết kí hiệu.',
  grade_level = 8,
  embed_url = '/experiments/mach-dien-don-gian/index.html'
WHERE embed_url = '/experiments/simple-circuit/index.html';
