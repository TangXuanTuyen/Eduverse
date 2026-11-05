-- Thêm thí nghiệm ảo "Tế bào nhân thực 3D" (Khối 6) để hiển thị ở cả phía HS và GV (GV giao cho lớp).
-- Chỉ thêm khi chưa có, nên chạy lại không tạo bản trùng.
INSERT INTO public.experiments (title, description, subject, grade_level, embed_url, component_key, duration_minutes, difficulty, is_published, sort_order)
SELECT
  'Tế bào nhân thực 3D',
  'Khối 6 · Tế bào nhân thực — Mô phỏng 3D tương tác: khám phá các bào quan, thực hành, luyện tập 10 câu hỏi và làm nhiệm vụ.',
  'sinh_hoc', 6,
  '/experiments/te-bao-nhan-thuc-3d/index.html',
  'te_bao_nhan_thuc_3d',
  20, 2, true, 4
WHERE NOT EXISTS (
  SELECT 1 FROM public.experiments WHERE embed_url = '/experiments/te-bao-nhan-thuc-3d/index.html'
);
