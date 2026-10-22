-- Seed: thêm mô hình 3D Tế bào nhân sơ (Khối 6 - Bài 19) vào bảng models_3d
-- để hiển thị ở cả phía HS và GV

INSERT INTO public.models_3d (title, description, category, subject, grade_level, embed_url, embed_type, is_published, sort_order)
VALUES
  (
    'Tế bào nhân sơ',
    'Bài 19 · Khối 6: Cấu tạo và chức năng các thành phần của tế bào — Mô hình 3D tương tác WebGL với 6 thành phần: Vùng nhân (ADN), Màng tế bào, Tế bào chất, Lông nhung, Thành tế bào, Roi.',
    'te_bao', 'sinh_hoc', 6,
    '/models-3d/te-bao-nhan-so/index.html',
    'iframe',
    true, 1
  )
ON CONFLICT DO NOTHING;
