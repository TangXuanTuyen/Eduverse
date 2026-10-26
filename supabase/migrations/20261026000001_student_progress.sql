-- Lưu XP/level học sinh vĩnh viễn thay vì localStorage
create table public.student_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  level smallint not null default 1 check (level >= 1),
  current_xp int not null default 0 check (current_xp >= 0),
  total_xp int not null default 0 check (total_xp >= 0),
  quizzes_completed int not null default 0 check (quizzes_completed >= 0),
  high_score int not null default 0 check (high_score >= 0),
  experiments_completed text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.student_progress enable row level security;

-- Học sinh chỉ đọc progress của mình
create policy student_progress_own_select on public.student_progress
  for select to authenticated
  using (user_id = auth.uid());

-- Xếp hạng trong lớp: HS đọc progress của bạn cùng room
create policy student_progress_classmate_select on public.student_progress
  for select to authenticated
  using (
    exists (
      select 1
      from public.room_members m1
      join public.room_members m2 on m1.room_id = m2.room_id
      where m1.user_id = auth.uid()
        and m2.user_id = student_progress.user_id
        and m1.is_active and m2.is_active
    )
  );

-- GV đọc progress HS trong phòng mình quản lý
create policy student_progress_teacher_select on public.student_progress
  for select to authenticated
  using (
    exists (
      select 1
      from public.rooms r
      where r.owner_id = auth.uid()
        and exists (
          select 1 from public.room_members m
          where m.room_id = r.id and m.user_id = student_progress.user_id and m.is_active
        )
    )
  );

-- Ghi chỉ qua service_role (quy tắc 1, 5)
revoke all on table public.student_progress from anon, authenticated;
grant select on table public.student_progress to authenticated;

-- RPC: lấy xếp hạng trong lớp (room)
create or replace function public.get_class_leaderboard(p_room_id uuid)
returns table (
  user_id uuid,
  display_name text,
  level smallint,
  total_xp int,
  rank bigint
)
language sql stable
security definer
set search_path = ''
as $$
  select
    sp.user_id,
    p.display_name,
    sp.level,
    sp.total_xp,
    row_number() over (order by sp.total_xp desc, sp.level desc) as rank
  from public.student_progress sp
  join public.profiles p on p.id = sp.user_id
  join public.room_members m on m.user_id = sp.user_id and m.room_id = p_room_id and m.is_active
  where exists (
    select 1 from public.room_members m2
    where m2.room_id = p_room_id and m2.user_id = auth.uid() and m2.is_active
  )
  order by sp.total_xp desc, sp.level desc
  limit 50;
$$;

grant execute on function public.get_class_leaderboard(uuid) to authenticated;

-- RPC: cập nhật progress (chỉ service_role gọi)
create or replace function public.upsert_student_progress(
  p_user_id uuid,
  p_level smallint,
  p_current_xp int,
  p_total_xp int,
  p_quizzes_completed int default 0,
  p_high_score int default 0,
  p_experiments_completed text[] default '{}'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.student_progress (user_id, level, current_xp, total_xp, quizzes_completed, high_score, experiments_completed, updated_at)
  values (p_user_id, p_level, p_current_xp, p_total_xp, p_quizzes_completed, p_high_score, p_experiments_completed, now())
  on conflict (user_id) do update set
    level = excluded.level,
    current_xp = excluded.current_xp,
    total_xp = excluded.total_xp,
    quizzes_completed = excluded.quizzes_completed,
    high_score = excluded.high_score,
    experiments_completed = excluded.experiments_completed,
    updated_at = now();
end;
$$;

-- Chỉ service_role được gọi upsert
revoke execute on function public.upsert_student_progress(uuid, smallint, int, int, int, int, text[]) from anon, authenticated;
