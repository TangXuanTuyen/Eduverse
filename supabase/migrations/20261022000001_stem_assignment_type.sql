-- Thêm loại nhiệm vụ 'stem' (thí nghiệm STEM Lab) vào assignment_type
ALTER TABLE public.assignments
  DROP CONSTRAINT IF EXISTS assignments_assignment_type_check;

ALTER TABLE public.assignments
  ADD CONSTRAINT assignments_assignment_type_check
    CHECK (assignment_type IN ('quiz', 'lesson', 'experiment', 'model3d', 'stem'));

COMMENT ON COLUMN public.assignments.assignment_type IS 'quiz = bài tập câu hỏi, lesson = đọc lý thuyết, experiment = xem thí nghiệm, model3d = xem mô hình 3D, stem = thí nghiệm STEM Lab';
