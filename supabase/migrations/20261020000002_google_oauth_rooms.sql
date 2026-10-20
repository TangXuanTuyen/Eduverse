-- =====================================================================
-- Bước 2: Google OAuth + Phòng học (Room) thay cho Trường/Lớp
-- Migration bổ sung, KHÔNG sửa migration 1.
-- =====================================================================

-- ==========  1. DỌN DẸP CẤU TRÚC CŨ  ==========

-- Xóa RLS policies phụ thuộc vào bảng/hàm cũ
drop policy if exists schools_select on public.schools;
drop policy if exists classes_select on public.classes;
drop policy if exists class_members_select on public.class_members;

-- Xóa policies trên profiles/parent_links (sẽ tạo lại)
drop policy if exists profiles_select on public.profiles;
drop policy if exists parent_links_select on public.parent_links;

-- Thu hồi quyền trước khi xóa hàm
revoke all on function
  public.app_current_school_id(),
  public.is_school_admin_of(uuid),
  public.is_school_admin_of_class(uuid),
  public.is_class_teacher(uuid),
  public.is_class_student(uuid),
  public.teaches_student(uuid),
  public.get_class_roster(uuid)
  from public, anon, authenticated, service_role;

-- Xóa hàm cũ
drop function public.app_current_school_id();
drop function public.is_school_admin_of(uuid);
drop function public.is_school_admin_of_class(uuid);
drop function public.is_class_teacher(uuid);
drop function public.is_class_student(uuid);
drop function public.teaches_student(uuid);
drop function public.get_class_roster(uuid);

-- Xóa trigger class_members_check trước khi xóa hàm
drop trigger if exists class_members_check on public.class_members;
drop function public.class_members_check();

-- Thu hồi quyền trên bảng cũ
revoke all on table public.class_members, public.classes, public.schools
  from public, anon, authenticated;

-- Xóa bảng cũ (theo thứ tự FK)
drop table public.class_members;
drop table public.classes;

-- Xóa constraints trên profiles phụ thuộc vào schools
alter table public.profiles drop constraint if exists profiles_role_needs_school;
alter table public.profiles drop constraint if exists profiles_student_code_only_for_students;

-- Xóa cột cũ
alter table public.profiles drop column if exists school_id;
alter table public.profiles drop column if exists student_code;
alter table public.profiles drop column if exists must_change_password;

-- Giờ mới xóa schools
drop table public.schools;

-- Xóa enum cũ
drop type if exists public.class_member_role;

-- Thêm cột mới
alter table public.profiles add column avatar_url text;

-- Chặn role cũ (admin, school_admin) — PG không cho xóa giá trị enum,
-- nên dùng CHECK constraint thay thế
alter table public.profiles add constraint profiles_role_allowed
  check (role is null or role in ('teacher', 'student', 'parent'));

-- Cập nhật trigger guard: bỏ kiểm tra school_id, student_code, must_change_password
create or replace function public.profiles_guard_privileged_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      raise exception 'Không được tự tạo hồ sơ' using errcode = '42501';
    end if;
    if new.role is distinct from old.role
       or new.id is distinct from old.id then
      raise exception 'Không được tự thay đổi vai trò' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

-- Cập nhật trigger tạo user: lấy display_name và avatar_url từ Google metadata
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_avatar text;
begin
  v_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    ''
  );
  v_avatar := new.raw_user_meta_data ->> 'avatar_url';
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, left(v_name, 100), v_avatar)
  on conflict (id) do update set
    display_name = case
      when public.profiles.display_name = '' then excluded.display_name
      else public.profiles.display_name
    end,
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);
  return new;
end;
$$;

-- Cập nhật parent_links_check: bỏ kiểm tra cùng trường
create or replace function public.parent_links_check()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_parent_role public.app_role;
  v_student_role public.app_role;
begin
  select p.role into v_parent_role from public.profiles p where p.id = new.parent_id;
  select p.role into v_student_role from public.profiles p where p.id = new.student_id;
  if v_parent_role is distinct from 'parent' or v_student_role is distinct from 'student' then
    raise exception 'Liên kết phải từ tài khoản phụ huynh tới tài khoản học sinh' using errcode = '23514';
  end if;
  return new;
end;
$$;

-- ==========  2. BẢNG MỚI  ==========

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  subject text check (subject is null or char_length(subject) <= 100),
  grade smallint check (grade is null or grade between 6 and 9),
  join_code text unique check (join_code ~ '^[A-HJ-NP-Z2-9]{6,8}$'),
  join_code_expires_at timestamptz,
  is_active boolean not null default true,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.room_members (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  is_active boolean not null default true,
  primary key (room_id, user_id)
);
create index room_members_user_id_idx on public.room_members (user_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  room_id uuid references public.rooms (id) on delete cascade,
  type text not null check (char_length(type) <= 50),
  title text not null check (char_length(title) <= 200),
  body text not null default '' check (char_length(body) <= 1000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_unread_idx on public.notifications (user_id) where not is_read;

-- ==========  3. HÀM TRỢ GIÚP MỚI  ==========

create function public.is_room_owner(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.rooms r
    where r.id = p_room_id and r.owner_id = (select auth.uid())
  );
$$;

create function public.is_room_member(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.room_members m
    where m.room_id = p_room_id
      and m.user_id = (select auth.uid())
      and m.is_active
  );
$$;

-- Danh sách học sinh trong phòng (giáo viên dùng)
create function public.get_room_roster(p_room_id uuid)
returns table (user_id uuid, display_name text, avatar_url text, grade smallint)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name, p.avatar_url, p.grade
  from public.room_members m
  join public.profiles p on p.id = m.user_id
  where m.room_id = p_room_id
    and m.is_active
    and p.role = 'student'
    and public.is_room_owner(p_room_id)
  order by p.display_name;
$$;

-- Cập nhật get_my_children: bỏ phụ thuộc school
create or replace function public.get_my_children()
returns table (student_id uuid, display_name text, grade smallint)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name, p.grade
  from public.parent_links l
  join public.profiles p on p.id = l.student_id
  where l.parent_id = (select auth.uid())
    and l.status = 'approved'
    and public.app_current_role() = 'parent'
  order by p.display_name;
$$;

-- Tạo mã phòng ngẫu nhiên (bỏ ký tự dễ nhầm: O, 0, I, 1)
create function public.generate_join_code()
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
    exit when not exists (select 1 from public.rooms where join_code = v_code);
  end loop;
  return v_code;
end;
$$;

-- RPC: Học sinh tham gia phòng bằng mã
create function public.join_room(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room record;
  v_uid uuid := (select auth.uid());
  v_role public.app_role;
begin
  if v_uid is null then
    raise exception 'Chưa đăng nhập' using errcode = '42501';
  end if;

  select role into v_role from public.profiles where id = v_uid;
  if v_role is distinct from 'student' then
    raise exception 'Chỉ học sinh mới nhập mã phòng' using errcode = '42501';
  end if;

  select r.* into v_room
  from public.rooms r
  where upper(r.join_code) = upper(p_code)
    and r.is_active;

  if not found then
    raise exception 'Mã phòng không hợp lệ' using errcode = 'P0001';
  end if;

  if v_room.join_code_expires_at is not null and v_room.join_code_expires_at < now() then
    raise exception 'Mã phòng đã hết hạn' using errcode = 'P0001';
  end if;

  -- Đã tham gia rồi thì trả về luôn
  if exists (select 1 from public.room_members where room_id = v_room.id and user_id = v_uid) then
    update public.room_members set is_active = true where room_id = v_room.id and user_id = v_uid;
    return v_room.id;
  end if;

  insert into public.room_members (room_id, user_id)
  values (v_room.id, v_uid);

  return v_room.id;
end;
$$;

-- ==========  4. QUYỀN  ==========

revoke all on table public.rooms, public.room_members, public.notifications
  from public, anon, authenticated;

grant select on table public.rooms, public.room_members, public.notifications
  to authenticated;

revoke execute on function
  public.is_room_owner(uuid),
  public.is_room_member(uuid),
  public.get_room_roster(uuid),
  public.generate_join_code(),
  public.join_room(text)
  from public, anon, authenticated;

grant execute on function
  public.is_room_owner(uuid),
  public.is_room_member(uuid),
  public.get_room_roster(uuid),
  public.join_room(text)
  to authenticated;

grant execute on function
  public.generate_join_code()
  to service_role;

-- ==========  5. RLS  ==========

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.notifications enable row level security;

-- Phòng: thành viên hoặc chủ phòng mới thấy
create policy rooms_select on public.rooms
  for select to authenticated
  using (
    owner_id = (select auth.uid())
    or public.is_room_member(id)
  );

-- Thành viên phòng: thấy tất cả bạn cùng phòng (nếu mình cũng là thành viên)
create policy room_members_select on public.room_members
  for select to authenticated
  using (
    public.is_room_member(room_id)
    or public.is_room_owner(room_id)
  );

-- Thông báo: chỉ thấy của mình
create policy notifications_select on public.notifications
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Profiles: chính mình, hoặc giáo viên cùng phòng (qua room roster)
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1 from public.room_members m1
      join public.room_members m2 on m2.room_id = m1.room_id
      where m1.user_id = (select auth.uid())
        and m2.user_id = public.profiles.id
        and m1.is_active and m2.is_active
    )
    or public.is_parent_of(id)
  );

-- Parent links: giữ tương tự nhưng bỏ school_admin check
create policy parent_links_select on public.parent_links
  for select to authenticated
  using (
    parent_id = (select auth.uid())
    or student_id = (select auth.uid())
    or exists (
      select 1 from public.room_members m
      join public.rooms r on r.id = m.room_id and r.owner_id = (select auth.uid())
      where m.user_id = parent_links.student_id and m.is_active
    )
  );
