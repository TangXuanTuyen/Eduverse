-- Câu sai trong các bài STEM Maker (xe đạp phát điện, thủy điện mini) đưa vào Trạm Sửa Lỗi của từng học sinh.
-- Nguồn thứ ba của review_queue: bài STEM + mã câu hỏi (máy chủ giữ kho câu hỏi để chấm).

ALTER TABLE public.review_queue
  ADD COLUMN source_stem_project text,
  ADD COLUMN source_stem_question text;

ALTER TABLE public.review_queue DROP CONSTRAINT review_queue_one_source;

ALTER TABLE public.review_queue
  ADD CONSTRAINT review_queue_one_source CHECK (
    (source_question_id IS NOT NULL AND source_lesson_id IS NULL AND source_stem_project IS NULL)
    OR (source_lesson_id IS NOT NULL AND source_block_key IS NOT NULL AND source_question_id IS NULL AND source_stem_project IS NULL)
    OR (source_stem_project IS NOT NULL AND source_stem_question IS NOT NULL AND source_question_id IS NULL AND source_lesson_id IS NULL)
  );

CREATE UNIQUE INDEX review_queue_stem_question_uniq
  ON public.review_queue (student_id, source_stem_project, source_stem_question)
  WHERE source_stem_project IS NOT NULL;
