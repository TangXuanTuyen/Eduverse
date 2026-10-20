-- Bước 4A: Xưởng trò chơi — bảng, RLS, helper functions, grants

-- Enums
create type public.game_mode as enum ('tu_luyen', 'thi_dau');
create type public.game_status as enum ('draft', 'ready', 'live', 'finished');
create type public.game_session_status as enum ('waiting', 'active', 'finished');

-- ---------------------------------------------------------------------------
-- games: template trò chơi của giáo viên (tái sử dụng)
-- ---------------------------------------------------------------------------
create table public.games (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  question_set_id uuid not null references public.question_sets(id) on delete restrict,
  name text not null check (char_length(name) between 1 and 200),
  mode public.game_mode not null default 'thi_dau',
  time_per_question smallint not null default 30 check (time_per_question between 5 and 120),
  points_per_question smallint not null default 100 check (points_per_question between 1 and 1000),
  shuffle_questions boolean not null default false,
  shuffle_options boolean not null default false,
  level_progression boolean not null default false,
  status public.game_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index games_owner_id_idx on public.games(owner_id);

create trigger games_updated_at before update on public.games
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- game_questions: snapshot câu hỏi — HS KHÔNG ĐƯỢC đọc (chứa correct_answer)
-- ---------------------------------------------------------------------------
create table public.game_questions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  source_question_id uuid references public.questions(id) on delete set null,
  sort_order smallint not null default 0,
  type public.question_type not null,
  content text not null,
  options jsonb,
  correct_answer jsonb,
  explanation text not null default '',
  points smallint not null default 100,
  unique (game_id, sort_order)
);
create index game_questions_game_id_idx on public.game_questions(game_id);

-- ---------------------------------------------------------------------------
-- game_sessions: một phiên chơi cụ thể
-- ---------------------------------------------------------------------------
create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  join_code text not null unique check (join_code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  status public.game_session_status not null default 'waiting',
  current_question_index smallint not null default -1,
  question_started_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index game_sessions_game_id_idx on public.game_sessions(game_id);
create index game_sessions_join_code_idx on public.game_sessions(join_code);

-- ---------------------------------------------------------------------------
-- game_players: người chơi trong phiên
-- ---------------------------------------------------------------------------
create table public.game_players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 50),
  total_score int not null default 0,
  current_streak smallint not null default 0,
  joined_at timestamptz not null default now(),
  unique (session_id, user_id)
);
create index game_players_session_id_idx on public.game_players(session_id);

-- ---------------------------------------------------------------------------
-- game_responses: câu trả lời từng câu
-- ---------------------------------------------------------------------------
create table public.game_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  player_id uuid not null references public.game_players(id) on delete cascade,
  question_id uuid not null references public.game_questions(id) on delete cascade,
  answer jsonb,
  is_correct boolean,
  time_ms int,
  score int not null default 0,
  answered_at timestamptz not null default now(),
  unique (player_id, question_id)
);
create index game_responses_session_id_idx on public.game_responses(session_id);

-- ---------------------------------------------------------------------------
-- Helper: generate join code cho game sessions (giống rooms nhưng check game_sessions)
-- ---------------------------------------------------------------------------
create function public.generate_game_join_code()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
  v_i integer;
begin
  loop
    v_code := '';
    for v_i in 1..6 loop
      v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
    end loop;
    exit when not exists (select 1 from public.game_sessions where join_code = v_code);
  end loop;
  return v_code;
end;
$$;

-- ---------------------------------------------------------------------------
-- Helper: kiểm tra user là owner của game chứa session
-- ---------------------------------------------------------------------------
create function public.is_game_session_owner(p_session_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.game_sessions gs
    join public.games g on g.id = gs.game_id
    where gs.id = p_session_id
      and g.owner_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.games enable row level security;
alter table public.game_questions enable row level security;
alter table public.game_sessions enable row level security;
alter table public.game_players enable row level security;
alter table public.game_responses enable row level security;

-- games: GV chỉ thấy game mình tạo
create policy "teacher_own_games" on public.games
  for select using (owner_id = auth.uid());

-- game_questions: KHÔNG cho authenticated đọc (giống question_answers)
-- Truy cập qua server actions

-- game_sessions: player đã join hoặc owner thấy
create policy "session_visible" on public.game_sessions
  for select using (
    created_by = auth.uid()
    or exists (
      select 1 from public.game_players gp
      where gp.session_id = game_sessions.id and gp.user_id = auth.uid()
    )
  );

-- game_players: player thấy mình, owner thấy tất cả
create policy "players_visible" on public.game_players
  for select using (
    user_id = auth.uid()
    or public.is_game_session_owner(session_id)
  );

-- game_responses: player thấy mình, owner thấy tất cả
create policy "responses_visible" on public.game_responses
  for select using (
    player_id in (select id from public.game_players where user_id = auth.uid())
    or public.is_game_session_owner(session_id)
  );

-- ---------------------------------------------------------------------------
-- Grants: authenticated chỉ SELECT, ghi qua service role
-- ---------------------------------------------------------------------------
revoke all on public.games from anon, authenticated;
grant select on public.games to authenticated;

revoke all on public.game_questions from anon, authenticated;
-- KHÔNG grant SELECT cho game_questions (chứa correct_answer)

revoke all on public.game_sessions from anon, authenticated;
grant select on public.game_sessions to authenticated;

revoke all on public.game_players from anon, authenticated;
grant select on public.game_players to authenticated;

revoke all on public.game_responses from anon, authenticated;
grant select on public.game_responses to authenticated;

-- Grant execute cho helper functions
grant execute on function public.generate_game_join_code() to service_role;
grant execute on function public.is_game_session_owner(uuid) to authenticated;
