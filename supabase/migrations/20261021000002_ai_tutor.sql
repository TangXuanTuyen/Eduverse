-- Bước 9: AI Tutor & Companion
-- Bảng hội thoại AI, tin nhắn, giới hạn lượt, cài đặt AI theo phòng

-- ai_conversations
CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('lesson', 'assignment', 'review', 'companion')),
  source text NOT NULL DEFAULT 'page' CHECK (source IN ('page', 'companion')),
  context_type text,
  context_id uuid,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  message_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_conversations FROM anon, authenticated;
GRANT SELECT ON public.ai_conversations TO authenticated;

CREATE POLICY "Học sinh xem hội thoại của mình"
  ON public.ai_conversations FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE TRIGGER touch_ai_conversations_updated
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ai_messages
CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  tokens_used integer DEFAULT 0,
  flagged boolean NOT NULL DEFAULT false,
  flag_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_messages FROM anon, authenticated;
GRANT SELECT ON public.ai_messages TO authenticated;

CREATE POLICY "Học sinh xem tin nhắn hội thoại của mình"
  ON public.ai_messages FOR SELECT TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM public.ai_conversations WHERE student_id = auth.uid()
    )
  );

-- ai_usage_limits (rate limiting per student per day)
CREATE TABLE public.ai_usage_limits (
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  request_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (student_id, usage_date)
);

ALTER TABLE public.ai_usage_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_usage_limits FROM anon, authenticated;
GRANT SELECT ON public.ai_usage_limits TO authenticated;

CREATE POLICY "Học sinh xem giới hạn của mình"
  ON public.ai_usage_limits FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Atomic rate limit check + increment
CREATE OR REPLACE FUNCTION public.increment_ai_usage(
  p_student_id uuid,
  p_daily_limit integer DEFAULT 30
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO public.ai_usage_limits (student_id, usage_date, request_count)
  VALUES (p_student_id, CURRENT_DATE, 1)
  ON CONFLICT (student_id, usage_date) DO UPDATE
    SET request_count = public.ai_usage_limits.request_count + 1
    WHERE public.ai_usage_limits.request_count < p_daily_limit
  RETURNING request_count INTO v_count;

  RETURN v_count IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_ai_usage FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_ai_usage TO authenticated;

-- ai_room_settings (per-room AI toggle)
CREATE TABLE public.ai_room_settings (
  room_id uuid PRIMARY KEY REFERENCES public.rooms(id) ON DELETE CASCADE,
  ai_enabled boolean NOT NULL DEFAULT true,
  daily_limit_per_student integer NOT NULL DEFAULT 30 CHECK (daily_limit_per_student BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_room_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_room_settings FROM anon, authenticated;
GRANT SELECT ON public.ai_room_settings TO authenticated;

CREATE POLICY "Thành viên phòng xem cài đặt AI"
  ON public.ai_room_settings FOR SELECT TO authenticated
  USING (
    room_id IN (
      SELECT room_id FROM public.room_members WHERE user_id = auth.uid() AND is_active = true
    )
    OR
    room_id IN (
      SELECT id FROM public.rooms WHERE owner_id = auth.uid()
    )
  );

CREATE TRIGGER touch_ai_room_settings_updated
  BEFORE UPDATE ON public.ai_room_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Extend audit_logs target_type to include ai_conversation
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_target_type_check;
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_target_type_check
  CHECK (target_type IN ('student', 'room', 'assignment', 'report', 'ai_conversation'));

-- Indexes
CREATE INDEX idx_ai_conversations_student ON public.ai_conversations(student_id, created_at DESC);
CREATE INDEX idx_ai_conversations_room ON public.ai_conversations(room_id) WHERE room_id IS NOT NULL;
CREATE INDEX idx_ai_messages_conversation ON public.ai_messages(conversation_id, created_at);
CREATE INDEX idx_ai_messages_flagged ON public.ai_messages(flagged) WHERE flagged = true;
