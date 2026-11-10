-- Đấu trường ánh sáng: đấu trực tuyến 2 bạn cùng lớp (bước 2). Máy chủ làm trọng tài.

create table public.duel_matches (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  host_id uuid not null references public.profiles(id) on delete cascade,
  guest_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'invited'
    check (status in ('invited', 'active', 'finished', 'declined', 'cancelled', 'expired')),
  question_ids uuid[] not null,
  current_index smallint not null default 0,
  round_started_at timestamptz,
  round_resolved_at timestamptz,
  round_winner text check (round_winner is null or round_winner in ('host', 'guest')),
  host_locked boolean not null default false,
  guest_locked boolean not null default false,
  host_score smallint not null default 0,
  guest_score smallint not null default 0,
  host_streak smallint not null default 0,
  guest_streak smallint not null default 0,
  host_max_streak smallint not null default 0,
  guest_max_streak smallint not null default 0,
  -- vị trí pha lê: âm = nghiêng về chủ trận (đội xanh), dương = nghiêng về khách (đội cam)
  crystal smallint not null default 0 check (crystal between -100 and 100),
  winner text check (winner is null or winner in ('host', 'guest', 'tie')),
  finalized boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (host_id <> guest_id)
);
create index duel_matches_guest_idx on public.duel_matches(guest_id, status);
create index duel_matches_host_idx on public.duel_matches(host_id, status);
create index duel_matches_assignment_idx on public.duel_matches(assignment_id);

create trigger duel_matches_updated_at before update on public.duel_matches
  for each row execute function public.touch_updated_at();

-- Mỗi người chỉ trả lời một lần cho mỗi câu trong một trận
create table public.duel_answers (
  match_id uuid not null references public.duel_matches(id) on delete cascade,
  question_id uuid not null references public.assignment_questions(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  selected_index smallint not null check (selected_index between 0 and 3),
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  primary key (match_id, question_id, player_id)
);

alter table public.duel_matches enable row level security;
alter table public.duel_answers enable row level security;
revoke all on public.duel_matches from anon, authenticated, public;
revoke all on public.duel_answers from anon, authenticated, public;
grant select on public.duel_matches to authenticated;
grant select on public.duel_answers to authenticated;

-- Người chơi chỉ đọc trận của mình; ghi chỉ qua máy chủ (service_role)
create policy "player_select_own_duel_matches" on public.duel_matches
  for select to authenticated
  using (host_id = auth.uid() or guest_id = auth.uid());

create policy "player_select_own_duel_answers" on public.duel_answers
  for select to authenticated
  using (player_id = auth.uid());

comment on table public.duel_matches is 'Trận Đấu trường ánh sáng giữa hai học sinh cùng lớp; máy chủ chấm và điều khiển vòng chơi';
