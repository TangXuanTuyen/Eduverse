-- Bước 5A: XP, ôn tập ngắt quãng, huy hiệu

-- Thêm question_type mới cho drag-drop
ALTER TYPE public.question_type ADD VALUE IF NOT EXISTS 'ordering';
ALTER TYPE public.question_type ADD VALUE IF NOT EXISTS 'matching';
ALTER TYPE public.question_type ADD VALUE IF NOT EXISTS 'classification';

-- ---------------------------------------------------------------------------
-- review_queue: hàng đợi ôn tập ngắt quãng (spaced repetition)
-- ---------------------------------------------------------------------------
CREATE TABLE public.review_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  question_content text NOT NULL,
  question_options jsonb,
  question_type public.question_type NOT NULL,
  explanation text NOT NULL DEFAULT '',
  skill_tags text[] NOT NULL DEFAULT '{}',
  difficulty smallint NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  wrong_count smallint NOT NULL DEFAULT 1,
  correct_streak smallint NOT NULL DEFAULT 0,
  interval_days smallint NOT NULL DEFAULT 1,
  next_review_at timestamptz NOT NULL DEFAULT now(),
  last_reviewed_at timestamptz,
  source_session_id uuid,
  source_response_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, source_question_id)
);
CREATE INDEX review_queue_student_next ON public.review_queue(student_id, next_review_at);
CREATE INDEX review_queue_student_tags ON public.review_queue USING gin(skill_tags);

CREATE TRIGGER review_queue_updated_at BEFORE UPDATE ON public.review_queue
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- xp_transactions: sổ cái XP idempotent
-- ---------------------------------------------------------------------------
CREATE TABLE public.xp_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount smallint NOT NULL CHECK (amount BETWEEN -500 AND 500),
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 200),
  idempotency_key text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, idempotency_key)
);
CREATE INDEX xp_transactions_student_date ON public.xp_transactions(student_id, created_at);

-- ---------------------------------------------------------------------------
-- badges: định nghĩa huy hiệu
-- ---------------------------------------------------------------------------
CREATE TABLE public.badges (
  id text PRIMARY KEY CHECK (char_length(id) BETWEEN 1 AND 50),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'learning' CHECK (category IN ('learning', 'effort', 'progress', 'mastery')),
  criteria jsonb NOT NULL DEFAULT '{}',
  xp_reward smallint NOT NULL DEFAULT 0,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- badge_awards: học sinh đạt huy hiệu nào
-- ---------------------------------------------------------------------------
CREATE TABLE public.badge_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id text NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, badge_id)
);
CREATE INDEX badge_awards_student ON public.badge_awards(student_id);

-- ---------------------------------------------------------------------------
-- student_stats: tổng hợp XP (materialized counters)
-- ---------------------------------------------------------------------------
CREATE TABLE public.student_stats (
  student_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_xp int NOT NULL DEFAULT 0,
  xp_today smallint NOT NULL DEFAULT 0,
  xp_today_date date NOT NULL DEFAULT CURRENT_DATE,
  current_level smallint NOT NULL DEFAULT 1,
  reviews_fixed int NOT NULL DEFAULT 0,
  games_completed int NOT NULL DEFAULT 0,
  current_daily_streak smallint NOT NULL DEFAULT 0,
  longest_daily_streak smallint NOT NULL DEFAULT 0,
  last_active_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER student_stats_updated_at BEFORE UPDATE ON public.student_stats
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY rq_student_select ON public.review_queue
  FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY xp_student_select ON public.xp_transactions
  FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY badges_select ON public.badges
  FOR SELECT TO authenticated USING (true);

CREATE POLICY ba_student_select ON public.badge_awards
  FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY ss_student_select ON public.student_stats
  FOR SELECT TO authenticated USING (student_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Grants: chỉ SELECT cho authenticated, ghi qua service_role
-- ---------------------------------------------------------------------------
REVOKE ALL ON public.review_queue FROM anon, authenticated;
REVOKE ALL ON public.xp_transactions FROM anon, authenticated;
REVOKE ALL ON public.badges FROM anon, authenticated;
REVOKE ALL ON public.badge_awards FROM anon, authenticated;
REVOKE ALL ON public.student_stats FROM anon, authenticated;

GRANT SELECT ON public.review_queue TO authenticated;
GRANT SELECT ON public.xp_transactions TO authenticated;
GRANT SELECT ON public.badges TO authenticated;
GRANT SELECT ON public.badge_awards TO authenticated;
GRANT SELECT ON public.student_stats TO authenticated;

-- ---------------------------------------------------------------------------
-- Seed huy hiệu mẫu
-- ---------------------------------------------------------------------------
INSERT INTO public.badges (id, name, description, icon, category, criteria, xp_reward, sort_order) VALUES
  ('first_game', 'Tân Binh Arcade', 'Hoàn thành trò chơi đầu tiên', '🎮', 'progress', '{"games_completed": 1}', 50, 1),
  ('first_review_fix', 'Thợ Sửa Lỗi', 'Sửa thành công 1 câu sai', '🔧', 'effort', '{"reviews_fixed": 1}', 60, 2),
  ('fix_5', 'Bậc Thầy Sửa Lỗi', 'Sửa thành công 5 câu sai', '🛡️', 'effort', '{"reviews_fixed": 5}', 100, 3),
  ('fix_20', 'Siêu Thợ Sửa', 'Sửa thành công 20 câu sai', '⚙️', 'mastery', '{"reviews_fixed": 20}', 200, 4),
  ('streak_3', 'Kiên Trì 3 Ngày', 'Học liên tục 3 ngày', '🔥', 'effort', '{"daily_streak": 3}', 80, 5),
  ('streak_7', 'Siêu Kiên Trì', 'Học liên tục 7 ngày', '⚡', 'effort', '{"daily_streak": 7}', 150, 6),
  ('boss_clear', 'Hạ Gục Boss', 'Thắng Boss chương đầu tiên', '👑', 'progress', '{"bosses_cleared": 1}', 100, 7),
  ('perfect_quick', 'Hoàn Hảo', '5/5 câu đúng trong Thử thách nhanh', '💎', 'mastery', '{"perfect_quick_challenges": 1}', 80, 8),
  ('level_5', 'Nhà Khám Phá', 'Đạt cấp độ 5', '🌟', 'progress', '{"level": 5}', 0, 9),
  ('level_10', 'Nhà Thông Thái', 'Đạt cấp độ 10', '🏆', 'progress', '{"level": 10}', 0, 10);
