-- Bước 6: Phòng học 3D — Mô hình 3D tương tác

-- Enum danh mục mô hình
create type public.model_category as enum ('te_bao', 'phan_tu', 'co_quan', 'thiet_bi', 'sinh_vat', 'khac');

-- Bảng catalog mô hình 3D (admin quản lý)
create table public.models_3d (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text not null default '',
  category       public.model_category not null default 'khac',
  subject        public.experiment_subject not null,
  grade_level    int not null default 6 check (grade_level between 6 and 9),
  thumbnail_url  text,
  embed_url      text not null,
  embed_type     text not null default 'iframe',
  is_published   bool not null default false,
  sort_order     int not null default 0,
  created_by     uuid references auth.users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- GV giao mô hình cho lớp
create table public.model_assignments (
  id          uuid primary key default gen_random_uuid(),
  model_id    uuid not null references public.models_3d(id) on delete cascade,
  room_id     uuid not null references public.rooms(id) on delete cascade,
  assigned_by uuid not null references auth.users(id),
  due_at      timestamptz,
  created_at  timestamptz not null default now(),
  unique (model_id, room_id)
);

-- HS xem mô hình (tracking)
create table public.model_views (
  id          uuid primary key default gen_random_uuid(),
  model_id    uuid not null references public.models_3d(id) on delete cascade,
  user_id     uuid not null references auth.users(id),
  viewed_at   timestamptz not null default now(),
  unique (model_id, user_id)
);

-- =========  RLS  =========

alter table public.models_3d enable row level security;
alter table public.model_assignments enable row level security;
alter table public.model_views enable row level security;

-- models_3d: authenticated thấy published
create policy "Authenticated xem model published"
  on public.models_3d for select to authenticated
  using (is_published = true);

-- model_assignments
create policy "Teacher xem model assignment mình giao"
  on public.model_assignments for select to authenticated
  using (assigned_by = auth.uid());

create policy "Student xem model assignment qua room"
  on public.model_assignments for select to authenticated
  using (exists (
    select 1 from public.room_members rm
    where rm.room_id = model_assignments.room_id
      and rm.user_id = auth.uid()
  ));

-- model_views
create policy "User xem view mình"
  on public.model_views for select to authenticated
  using (user_id = auth.uid());

-- =========  Grants  =========

revoke all on public.models_3d from anon, authenticated;
revoke all on public.model_assignments from anon, authenticated;
revoke all on public.model_views from anon, authenticated;

grant select on public.models_3d to authenticated;
grant select on public.model_assignments to authenticated;
grant select on public.model_views to authenticated;

-- Indexes
create index idx_models_3d_published on public.models_3d (is_published, subject, grade_level);
create index idx_model_assignments_room on public.model_assignments (room_id);
create index idx_model_views_user on public.model_views (user_id);
