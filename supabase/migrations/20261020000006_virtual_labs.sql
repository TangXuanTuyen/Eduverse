-- Bước 5: Phòng thí nghiệm ảo (Virtual Lab)

-- Mở lại vai trò admin (đã có trong enum app_role, chỉ bị chặn bởi CHECK)
alter table public.profiles drop constraint if exists profiles_role_allowed;
alter table public.profiles add constraint profiles_role_allowed
  check (role is null or role in ('admin', 'teacher', 'student', 'parent'));

-- Enum môn thí nghiệm
create type public.experiment_subject as enum ('vat_ly', 'hoa_hoc', 'sinh_hoc', 'khtn_chung');

-- Enum trạng thái lab submission
create type public.lab_submission_status as enum ('started', 'completed');

-- Bảng catalog thí nghiệm (admin quản lý)
create table public.experiments (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null default '',
  subject     public.experiment_subject not null,
  grade_level int not null default 6 check (grade_level between 6 and 9),
  thumbnail_url text,
  embed_url   text,
  component_key text,
  duration_minutes int not null default 15,
  difficulty  int not null default 1 check (difficulty between 1 and 3),
  is_published bool not null default false,
  sort_order  int not null default 0,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint experiments_has_content check (embed_url is not null or component_key is not null)
);

-- Các bước hướng dẫn TN
create table public.experiment_steps (
  id            uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.experiments(id) on delete cascade,
  step_number   int not null,
  title         text not null,
  instruction   text not null default '',
  image_url     text,
  unique (experiment_id, step_number)
);

-- GV giao TN cho lớp
create table public.lab_assignments (
  id            uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.experiments(id) on delete cascade,
  room_id       uuid not null references public.rooms(id) on delete cascade,
  assigned_by   uuid not null references auth.users(id),
  due_at        timestamptz,
  created_at    timestamptz not null default now(),
  unique (experiment_id, room_id)
);

-- HS làm TN
create table public.lab_submissions (
  id                uuid primary key default gen_random_uuid(),
  lab_assignment_id uuid references public.lab_assignments(id) on delete set null,
  experiment_id     uuid not null references public.experiments(id) on delete cascade,
  user_id           uuid not null references auth.users(id),
  status            public.lab_submission_status not null default 'started',
  started_at        timestamptz not null default now(),
  completed_at      timestamptz,
  notes             text,
  unique (experiment_id, user_id, lab_assignment_id)
);

-- =========  RLS  =========

alter table public.experiments enable row level security;
alter table public.experiment_steps enable row level security;
alter table public.lab_assignments enable row level security;
alter table public.lab_submissions enable row level security;

-- experiments: mọi authenticated thấy TN đã published
create policy "Authenticated xem TN published"
  on public.experiments for select to authenticated
  using (is_published = true);

-- experiment_steps: thấy steps của TN published
create policy "Authenticated xem steps TN published"
  on public.experiment_steps for select to authenticated
  using (exists (
    select 1 from public.experiments e
    where e.id = experiment_id and e.is_published = true
  ));

-- lab_assignments: teacher thấy mình giao, student thấy qua room_members
create policy "Teacher xem lab assignment mình giao"
  on public.lab_assignments for select to authenticated
  using (assigned_by = auth.uid());

create policy "Student xem lab assignment qua room"
  on public.lab_assignments for select to authenticated
  using (exists (
    select 1 from public.room_members rm
    where rm.room_id = lab_assignments.room_id
      and rm.user_id = auth.uid()
  ));

-- lab_submissions: student thấy mình, teacher thấy qua room
create policy "Student xem submission mình"
  on public.lab_submissions for select to authenticated
  using (user_id = auth.uid());

create policy "Teacher xem submission qua room"
  on public.lab_submissions for select to authenticated
  using (exists (
    select 1 from public.lab_assignments la
    join public.room_members rm on rm.room_id = la.room_id
    where la.id = lab_submissions.lab_assignment_id
      and la.assigned_by = auth.uid()
  ));

-- =========  Grants  =========

revoke all on public.experiments from anon, authenticated;
revoke all on public.experiment_steps from anon, authenticated;
revoke all on public.lab_assignments from anon, authenticated;
revoke all on public.lab_submissions from anon, authenticated;

grant select on public.experiments to authenticated;
grant select on public.experiment_steps to authenticated;
grant select on public.lab_assignments to authenticated;
grant select on public.lab_submissions to authenticated;

-- Index cho tra cứu nhanh
create index idx_experiments_published on public.experiments (is_published, subject, grade_level);
create index idx_lab_assignments_room on public.lab_assignments (room_id);
create index idx_lab_submissions_user on public.lab_submissions (user_id, experiment_id);
