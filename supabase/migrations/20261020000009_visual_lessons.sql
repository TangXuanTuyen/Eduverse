-- Bước 7: Thư viện học trực quan (KHTN)

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.lesson_status as enum ('draft', 'published', 'archived');

-- ---------------------------------------------------------------------------
-- lessons: bài học trực quan do admin tạo
-- ---------------------------------------------------------------------------
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 300),
  description text not null default '',
  subject public.experiment_subject not null,
  grade_level smallint not null check (grade_level between 6 and 9),
  chapter text not null default '',
  sort_order smallint not null default 0,
  thumbnail_url text,
  content jsonb not null default '[]'::jsonb,
  status public.lesson_status not null default 'draft',
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lessons_subject_grade_idx on public.lessons(subject, grade_level);

create trigger lessons_updated_at before update on public.lessons
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- lesson_progress: tiến độ học sinh theo bài
-- ---------------------------------------------------------------------------
create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  current_step smallint not null default 0,
  completed_steps smallint[] not null default '{}',
  is_completed boolean not null default false,
  score smallint,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);
create index lesson_progress_user_idx on public.lesson_progress(user_id);

create trigger lesson_progress_updated_at before update on public.lesson_progress
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- observation_notes: sổ tay quan sát của học sinh
-- ---------------------------------------------------------------------------
create table public.observation_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  step_index smallint not null,
  prediction text not null default '',
  observation text not null default '',
  explanation text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id, step_index)
);

create trigger observation_notes_updated_at before update on public.observation_notes
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- lesson_events: sự kiện học tập nhẹ (tiến độ)
-- ---------------------------------------------------------------------------
create table public.lesson_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  event_type text not null check (event_type in (
    'step_view', 'model_interact', 'sim_start', 'sim_complete',
    'lab_start', 'lab_complete', 'quiz_attempt', 'lesson_complete'
  )),
  step_index smallint,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index lesson_events_user_lesson_idx on public.lesson_events(user_id, lesson_id);

-- ---------------------------------------------------------------------------
-- lesson_assignments: GV giao bài cho lớp
-- ---------------------------------------------------------------------------
create table public.lesson_assignments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  assigned_by uuid not null references public.profiles(id) on delete cascade,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  unique (lesson_id, room_id)
);
create index lesson_assignments_room_idx on public.lesson_assignments(room_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.observation_notes enable row level security;
alter table public.lesson_events enable row level security;
alter table public.lesson_assignments enable row level security;

-- lessons: published cho mọi authenticated
create policy "lessons_published" on public.lessons
  for select using (status = 'published');
-- admin thấy tất cả (qua service_role)

-- lesson_progress: HS thấy mình, GV thấy qua room
create policy "progress_own" on public.lesson_progress
  for select using (user_id = auth.uid());

-- observation_notes: chỉ HS thấy mình
create policy "notes_own" on public.observation_notes
  for select using (user_id = auth.uid());

-- lesson_events: chỉ HS thấy mình
create policy "events_own" on public.lesson_events
  for select using (user_id = auth.uid());

-- lesson_assignments: GV thấy mình giao, HS thấy qua room
create policy "assignments_teacher" on public.lesson_assignments
  for select using (assigned_by = auth.uid());
create policy "assignments_student" on public.lesson_assignments
  for select using (
    exists (
      select 1 from public.room_members rm
      where rm.room_id = lesson_assignments.room_id
        and rm.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke all on public.lessons from anon, authenticated;
grant select on public.lessons to authenticated;

revoke all on public.lesson_progress from anon, authenticated;
grant select on public.lesson_progress to authenticated;

revoke all on public.observation_notes from anon, authenticated;
grant select on public.observation_notes to authenticated;

revoke all on public.lesson_events from anon, authenticated;
grant select on public.lesson_events to authenticated;

revoke all on public.lesson_assignments from anon, authenticated;
grant select on public.lesson_assignments to authenticated;
