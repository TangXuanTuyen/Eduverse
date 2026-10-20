-- Bước 7: Báo cáo cho giáo viên và phụ huynh
-- Bảng audit_logs, weekly_summaries, thêm published_at cho submissions

-- ---------------------------------------------------------------------------
-- audit_logs: ghi lại khi giáo viên xem dữ liệu một học sinh cụ thể
-- ---------------------------------------------------------------------------
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (char_length(action) BETWEEN 1 AND 100),
  target_type text NOT NULL CHECK (target_type IN ('student', 'room', 'assignment', 'report')),
  target_id uuid NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_actor_created ON public.audit_logs(actor_id, created_at DESC);
CREATE INDEX audit_logs_target ON public.audit_logs(target_type, target_id);

-- ---------------------------------------------------------------------------
-- weekly_summaries: tóm tắt tuần cho phụ huynh (computed bởi server, cache)
-- ---------------------------------------------------------------------------
CREATE TABLE public.weekly_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  summary_text text NOT NULL CHECK (char_length(summary_text) BETWEEN 1 AND 5000),
  stats jsonb NOT NULL DEFAULT '{}',
  suggestions text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, week_start)
);
CREATE INDEX weekly_summaries_student ON public.weekly_summaries(student_id, week_start DESC);

CREATE TRIGGER weekly_summaries_updated_at BEFORE UPDATE ON public.weekly_summaries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Thêm published_at cho submissions (kết quả chỉ hiển thị cho phụ huynh khi đã công bố)
-- ---------------------------------------------------------------------------
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_summaries ENABLE ROW LEVEL SECURITY;

-- audit_logs: chỉ service_role ghi, giáo viên xem log mình tạo
CREATE POLICY audit_logs_teacher_select ON public.audit_logs
  FOR SELECT TO authenticated
  USING (actor_id = auth.uid());

-- weekly_summaries: phụ huynh chỉ xem con đã duyệt
CREATE POLICY weekly_summaries_parent_select ON public.weekly_summaries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_links l
      WHERE l.parent_id = auth.uid()
        AND l.student_id = weekly_summaries.student_id
        AND l.status = 'approved'
    )
    OR student_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- Grants: chỉ SELECT cho authenticated, ghi qua service_role
-- ---------------------------------------------------------------------------
REVOKE ALL ON public.audit_logs FROM anon, authenticated;
REVOKE ALL ON public.weekly_summaries FROM anon, authenticated;

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT SELECT ON public.weekly_summaries TO authenticated;

-- Service role cần full access
GRANT ALL ON public.audit_logs TO service_role;
GRANT ALL ON public.weekly_summaries TO service_role;

-- ---------------------------------------------------------------------------
-- Hàm helper: tạo audit log (chỉ service role gọi)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_actor_id uuid,
  p_action text,
  p_target_type text,
  p_target_id uuid,
  p_metadata jsonb DEFAULT '{}',
  p_ip text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata, ip_address)
  VALUES (p_actor_id, p_action, p_target_type, p_target_id, p_metadata, p_ip)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_audit_log(uuid, text, text, uuid, jsonb, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_audit_log(uuid, text, text, uuid, jsonb, text) TO service_role;
