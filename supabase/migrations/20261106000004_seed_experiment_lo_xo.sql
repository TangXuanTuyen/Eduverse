-- Thêm thí nghiệm ảo "Bài 42: Biến dạng của lò xo" (Khối 6) để hiển thị ở cả phía HS và GV (GV giao cho lớp).
-- Chỉ thêm khi chưa có, nên chạy lại không tạo bản trùng.
INSERT INTO public.experiments (title, description, subject, grade_level, embed_url, component_key, duration_minutes, difficulty, is_published, sort_order)
SELECT
  'Bài 42: Biến dạng của lò xo',
  'Bài 42 · Khối 6: Biến dạng của lò xo — Đối chứng hai lò xo, treo quả nặng, đo độ dãn, ghi bảng số liệu, vẽ đồ thị và trả lời câu hỏi.',
  'vat_ly', 6,
  '/experiments/lo-xo-dan-hoi/index.html',
  'lo_xo_dan_hoi',
  20, 2, true, 3
WHERE NOT EXISTS (
  SELECT 1 FROM public.experiments WHERE embed_url = '/experiments/lo-xo-dan-hoi/index.html'
);
