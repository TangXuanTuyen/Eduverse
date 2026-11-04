-- Câu sai trong bài học (thư viện) cũng đưa vào Trạm Sửa Lỗi của từng học sinh.
-- Mỗi dòng review_queue có đúng một nguồn: câu hỏi ngân hàng hoặc khối câu hỏi trong bài học.

ALTER TABLE public.review_queue ALTER COLUMN source_question_id DROP NOT NULL;

ALTER TABLE public.review_queue
  ADD COLUMN source_lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  ADD COLUMN source_block_key text;

ALTER TABLE public.review_queue
  ADD CONSTRAINT review_queue_one_source CHECK (
    (source_question_id IS NOT NULL AND source_lesson_id IS NULL AND source_block_key IS NULL)
    OR (source_question_id IS NULL AND source_lesson_id IS NOT NULL AND source_block_key IS NOT NULL)
  );

-- Mỗi học sinh chỉ có một dòng cho cùng một khối câu hỏi trong bài học
CREATE UNIQUE INDEX review_queue_lesson_block_uniq
  ON public.review_queue (student_id, source_lesson_id, source_block_key)
  WHERE source_lesson_id IS NOT NULL;
