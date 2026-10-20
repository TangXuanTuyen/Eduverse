-- Bước 4F: Tự luyện + giao game làm bài tập

-- ---------------------------------------------------------------------------
-- game_assignments: GV giao game cho lớp làm bài tập
-- ---------------------------------------------------------------------------
create table public.game_assignments (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  assigned_by uuid not null references public.profiles(id) on delete cascade,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  unique (game_id, room_id)
);
create index game_assignments_room_id_idx on public.game_assignments(room_id);
create index game_assignments_game_id_idx on public.game_assignments(game_id);

-- RLS
alter table public.game_assignments enable row level security;

-- Teacher sees own assignments
create policy "teacher_own_game_assignments" on public.game_assignments
  for select using (assigned_by = auth.uid());

-- Student sees via room_members
create policy "student_game_assignments" on public.game_assignments
  for select using (
    exists (
      select 1 from public.room_members rm
      where rm.room_id = game_assignments.room_id
        and rm.user_id = auth.uid()
    )
  );

-- Grants
revoke all on public.game_assignments from anon, authenticated;
grant select on public.game_assignments to authenticated;
