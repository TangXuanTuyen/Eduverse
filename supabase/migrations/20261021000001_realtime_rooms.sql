-- Bước 8: Bản đồ thành phố, hiện diện Realtime và phòng chung
-- Bảng: room_sessions, room_session_participants, social_settings, student_reports

-- ---------------------------------------------------------------------------
-- room_sessions: phiên phòng chung do giáo viên tạo (co-op boss, giờ học đồng bộ, STEM nhóm)
-- ---------------------------------------------------------------------------
CREATE TABLE public.room_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('coop_boss', 'sync_lesson', 'stem_group')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  config jsonb NOT NULL DEFAULT '{}',
  state text NOT NULL DEFAULT 'waiting' CHECK (state IN ('waiting', 'active', 'finished')),
  current_step int NOT NULL DEFAULT 0,
  total_damage int NOT NULL DEFAULT 0,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX room_sessions_room_id_idx ON public.room_sessions(room_id);
CREATE INDEX room_sessions_state_idx ON public.room_sessions(state) WHERE state != 'finished';

-- ---------------------------------------------------------------------------
-- room_session_participants: ai tham gia phiên phòng chung
-- ---------------------------------------------------------------------------
CREATE TABLE public.room_session_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.room_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_answer_at timestamptz,
  score int NOT NULL DEFAULT 0,
  UNIQUE(session_id, user_id)
);
CREATE INDEX rsp_session_idx ON public.room_session_participants(session_id);

-- ---------------------------------------------------------------------------
-- social_settings: giáo viên bật/tắt tính năng xã hội theo phòng
-- ---------------------------------------------------------------------------
CREATE TABLE public.social_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE UNIQUE,
  social_enabled boolean NOT NULL DEFAULT true,
  emotes_enabled boolean NOT NULL DEFAULT true,
  active_hours_start time,
  active_hours_end time,
  updated_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- student_reports: báo cáo/chặn giữa học sinh → gửi thẳng giáo viên
-- ---------------------------------------------------------------------------
CREATE TABLE public.student_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 500),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (reporter_id != reported_id)
);
CREATE INDEX student_reports_room_idx ON public.student_reports(room_id);
CREATE INDEX student_reports_status_idx ON public.student_reports(status) WHERE status = 'pending';

-- ===========================================================================
-- RLS
-- ===========================================================================

ALTER TABLE public.room_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_reports ENABLE ROW LEVEL SECURITY;

-- room_sessions: thành viên phòng thấy
CREATE POLICY "room_sessions_select" ON public.room_sessions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.room_members rm
      WHERE rm.room_id = room_sessions.room_id
        AND rm.user_id = auth.uid()
        AND rm.is_active
    )
  );

-- room_session_participants: thành viên phòng thấy
CREATE POLICY "rsp_select" ON public.room_session_participants
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.room_sessions rs
      JOIN public.room_members rm ON rm.room_id = rs.room_id
      WHERE rs.id = room_session_participants.session_id
        AND rm.user_id = auth.uid()
        AND rm.is_active
    )
  );

-- social_settings: thành viên phòng đọc
CREATE POLICY "social_settings_select" ON public.social_settings
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.room_members rm
      WHERE rm.room_id = social_settings.room_id
        AND rm.user_id = auth.uid()
        AND rm.is_active
    )
  );

-- student_reports: người báo cáo xem được mình, giáo viên phòng xem tất cả
CREATE POLICY "reports_select" ON public.student_reports
  FOR SELECT TO authenticated USING (
    reporter_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = student_reports.room_id
        AND r.owner_id = auth.uid()
    )
  );

-- ===========================================================================
-- GRANT: học sinh chỉ SELECT; ghi qua server (service_role)
-- ===========================================================================

REVOKE ALL ON public.room_sessions FROM anon, authenticated;
REVOKE ALL ON public.room_session_participants FROM anon, authenticated;
REVOKE ALL ON public.social_settings FROM anon, authenticated;
REVOKE ALL ON public.student_reports FROM anon, authenticated;

GRANT SELECT ON public.room_sessions TO authenticated;
GRANT SELECT ON public.room_session_participants TO authenticated;
GRANT SELECT ON public.social_settings TO authenticated;
GRANT SELECT ON public.student_reports TO authenticated;
