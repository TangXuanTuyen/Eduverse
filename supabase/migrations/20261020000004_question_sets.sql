-- Bước 3E: Bộ đề — nhóm câu hỏi thành bộ để giao bài dễ hơn

-- ---------------------------------------------------------------------------
-- question_sets: bộ đề của giáo viên
-- ---------------------------------------------------------------------------
create table public.question_sets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  subject text not null default '',
  grade smallint check (grade is null or grade between 6 and 9),
  description text not null default '' check (char_length(description) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index question_sets_owner_id_idx on public.question_sets(owner_id);

create trigger question_sets_updated_at before update on public.question_sets
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- question_set_items: câu hỏi trong bộ đề
-- ---------------------------------------------------------------------------
create table public.question_set_items (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.question_sets(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  sort_order smallint not null default 0,
  unique (set_id, question_id)
);
create index question_set_items_set_id_idx on public.question_set_items(set_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.question_sets enable row level security;
alter table public.question_set_items enable row level security;

-- Giáo viên chỉ thấy bộ đề của mình
create policy "teacher_own_sets" on public.question_sets
  for select using (owner_id = auth.uid());

create policy "teacher_own_set_items" on public.question_set_items
  for select using (
    exists (
      select 1 from public.question_sets s
      where s.id = question_set_items.set_id and s.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Grants: authenticated chỉ SELECT, ghi qua service role
-- ---------------------------------------------------------------------------
revoke all on public.question_sets from anon, authenticated;
grant select on public.question_sets to authenticated;

revoke all on public.question_set_items from anon, authenticated;
grant select on public.question_set_items to authenticated;
