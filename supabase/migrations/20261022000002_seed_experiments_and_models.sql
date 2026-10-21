-- Seed: thêm 2 thí nghiệm ảo đã có file HTML vào bảng experiments
-- để hiển thị ở cả phía HS và GV

INSERT INTO public.experiments (title, description, subject, grade_level, embed_url, component_key, duration_minutes, difficulty, is_published, sort_order)
VALUES
  (
    'Vật dẫn điện, vật cách điện & Điện nghiệm',
    'Bài 21 · Chương V: Điện — Thử các vật liệu trong mạch điện để phân biệt vật dẫn điện và vật cách điện. Quan sát sự dịch chuyển điện tích giữa hai điện nghiệm.',
    'vat_ly', 8,
    '/experiments/vat-dan-dien-cach-dien/index.html',
    'vat_dan_dien_cach_dien',
    15, 1, true, 1
  ),
  (
    'Thí nghiệm lắp mạch điện đơn giản',
    'Bài 22 · Chương V: Điện — Kéo thả pin, bóng đèn, công tắc và dây dẫn để lắp mạch điện kín. Quan sát dòng điện và đèn sáng.',
    'vat_ly', 8,
    '/experiments/simple-circuit/index.html',
    'simple_circuit',
    15, 1, true, 2
  )
ON CONFLICT DO NOTHING;
