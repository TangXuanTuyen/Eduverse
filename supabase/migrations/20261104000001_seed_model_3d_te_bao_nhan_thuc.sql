-- Seed: thêm mô hình 3D Tế bào nhân thực (Khối 6) vào bảng models_3d
-- để hiển thị ở cả phía HS và GV (GV có thể giao cho lớp).
-- Chỉ thêm khi chưa có, nên chạy lại không tạo bản trùng.

INSERT INTO public.models_3d (title, description, category, subject, grade_level, embed_url, embed_type, is_published, sort_order)
SELECT
  'Tế bào nhân thực',
  'Khối 6 · Mô hình 3D tương tác WebGL: màng tế bào, tế bào chất, nhân và nhân con, ti thể, lưới nội chất, bộ máy Golgi, lysosome, trung thể, ribosome. Kéo để xoay, bấm vào bào quan để xem chức năng.',
  'te_bao', 'sinh_hoc', 6,
  '/models-3d/te-bao-nhan-thuc/index.html',
  'iframe',
  true, 2
WHERE NOT EXISTS (
  SELECT 1 FROM public.models_3d WHERE embed_url = '/models-3d/te-bao-nhan-thuc/index.html'
);
