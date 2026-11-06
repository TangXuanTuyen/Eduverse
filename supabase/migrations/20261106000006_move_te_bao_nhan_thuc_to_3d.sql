-- Chuyển "Tế bào nhân thực 3D" từ phòng thí nghiệm ảo sang phòng mô phỏng 3D (Khối 6).
-- Bản mô phỏng đầy đủ thay bản đơn giản tại cùng đường dẫn /models-3d/te-bao-nhan-thuc/.

DELETE FROM public.experiments
WHERE embed_url = '/experiments/te-bao-nhan-thuc-3d/index.html';

UPDATE public.models_3d
SET
  description = 'Khối 6 · Tế bào nhân thực — Mô phỏng 3D tương tác: khám phá các bào quan, thực hành, luyện tập 10 câu hỏi và làm nhiệm vụ.',
  thumbnail_url = '/models-3d/thumbs/te-bao-nhan-thuc-3d.jpg'
WHERE embed_url = '/models-3d/te-bao-nhan-thuc/index.html';

UPDATE public.models_3d
SET thumbnail_url = '/models-3d/thumbs/te-bao-nhan-so.jpg'
WHERE embed_url = '/models-3d/te-bao-nhan-so/index.html';
