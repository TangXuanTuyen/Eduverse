-- Mở rộng assignments: loại bài tập "nhiệm vụ" (lesson/experiment)
-- và bảng task_completions cho nhiệm vụ không phải quiz

-- 1. Thêm cột vào assignments
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS assignment_type text NOT NULL DEFAULT 'quiz'
    CHECK (assignment_type IN ('quiz', 'lesson', 'experiment')),
  ADD COLUMN IF NOT EXISTS resource_id text,
  ADD COLUMN IF NOT EXISTS resource_title text;

-- 2. Thêm cột assignments_completed vào student_stats
ALTER TABLE public.student_stats
  ADD COLUMN IF NOT EXISTS assignments_completed int NOT NULL DEFAULT 0;

-- 3. Bảng task_completions
CREATE TABLE IF NOT EXISTS public.task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id),
  completed_at timestamptz NOT NULL DEFAULT now(),
  time_spent_seconds int,
  UNIQUE (assignment_id, student_id)
);

ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

-- Revoke mọi quyền — chỉ service_role mới INSERT
REVOKE ALL ON public.task_completions FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.task_completions TO authenticated;

-- Student chỉ đọc bản ghi của mình
CREATE POLICY "student_select_own_task_completions"
  ON public.task_completions
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Không cho authenticated INSERT/UPDATE/DELETE trực tiếp — chỉ service_role
-- (tuân thủ quy tắc: ghi đi qua server)

COMMENT ON TABLE public.task_completions IS 'Ghi nhận HS hoàn thành nhiệm vụ xem lý thuyết/thí nghiệm';
COMMENT ON COLUMN public.assignments.assignment_type IS 'quiz = bài tập câu hỏi, lesson = đọc lý thuyết, experiment = xem thí nghiệm';
