-- =====================================================================
-- Bước 1: trường, hồ sơ, lớp, liên kết phụ huynh, phân quyền, RLS
-- Nguyên tắc:
--  * Người dùng (anon/authenticated) KHÔNG có quyền ghi trực tiếp vào bảng nào.
--    Mọi thao tác ghi đi qua server dùng service_role hoặc RPC có kiểm tra quyền.
--  * Vai trò chỉ đọc từ public.profiles, không bao giờ từ metadata trong JWT.
--  * Hàm security definer luôn có `set search_path = ''`.
-- =====================================================================

-- ---------- Kiểu dữ liệu ----------
create type public.app_role as enum ('admin', 'school_admin', 'teacher', 'student', 'parent');
create type public.parent_link_status as enum ('pending', 'approved', 'rejected');
create type public.class_member_role as enum ('teacher', 'student');

-- ---------- Bảng ----------
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 200),
  code text not null unique check (code ~ '^[A-Z0-9]{3,16}$'),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  school_id uuid references public.schools (id) on delete restrict,
  -- NULL = chưa được cấp quyền (mặc định khi tạo tài khoản)
  role public.app_role,
  -- Mã học sinh duy nhất toàn hệ thống vì email nội bộ chỉ suy ra từ mã
  student_code text unique check (student_code ~ '^[A-Z0-9]{4,20}$'),
  display_name text not null default '' check (char_length(display_name) <= 100),
  grade smallint check (grade between 6 and 9),
  must_change_password boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_student_code_only_for_students
    check (student_code is null or role = 'student'),
  constraint profiles_role_needs_school
    check (role is null or role = 'admin' or school_id is not null)
);

comment on table public.profiles is
  'Hồ sơ tối thiểu. Không lưu email, số điện thoại, địa chỉ, ảnh của học sinh.';

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 50),
  grade smallint not null check (grade between 6 and 9),
  school_year text not null check (school_year ~ '^[0-9]{4}-[0-9]{4}$'),
  created_at timestamptz not null default now(),
  unique (school_id, school_year, name)
);

create table public.class_members (
  class_id uuid not null references public.classes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  member_role public.class_member_role not null,
  joined_at timestamptz not null default now(),
  primary key (class_id, user_id)
);
create index class_members_user_id_idx on public.class_members (user_id);

create table public.parent_links (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  status public.parent_link_status not null default 'pending',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles (id) on delete set null,
  unique (parent_id, student_id),
  check (parent_id <> student_id)
);
create index parent_links_student_id_idx on public.parent_links (student_id);

-- Đếm đăng nhập sai. key = sha256 của định danh hoặc IP (không lưu định danh gốc).
create table public.login_attempts (
  key text primary key check (key ~ '^[a-z]+:[0-9a-f]{64}$'),
  failed_count integer not null default 0,
  window_started_at timestamptz not null default now(),
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

-- ---------- Toàn vẹn dữ liệu ----------
create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Phòng thủ hai lớp: kể cả khi sau này có ai cấp nhầm quyền UPDATE,
-- người dùng thường vẫn không đổi được các cột đặc quyền.
create function public.profiles_guard_privileged_columns()
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
       or new.school_id is distinct from old.school_id
       or new.student_code is distinct from old.student_code
       or new.must_change_password is distinct from old.must_change_password
       or new.id is distinct from old.id then
      raise exception 'Không được tự thay đổi vai trò, trường hoặc mã học sinh' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_privileged_columns
  before insert or update on public.profiles
  for each row execute function public.profiles_guard_privileged_columns();

-- Thành viên lớp phải cùng trường và đúng vai trò
create function public.class_members_check()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_class_school uuid;
  v_profile record;
begin
  select c.school_id into v_class_school from public.classes c where c.id = new.class_id;
  select p.role, p.school_id into v_profile from public.profiles p where p.id = new.user_id;
  if v_profile.school_id is distinct from v_class_school then
    raise exception 'Thành viên lớp phải thuộc cùng trường' using errcode = '23514';
  end if;
  if (new.member_role = 'teacher' and v_profile.role is distinct from 'teacher')
     or (new.member_role = 'student' and v_profile.role is distinct from 'student') then
    raise exception 'Vai trò thành viên lớp không khớp với vai trò tài khoản' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger class_members_check
  before insert or update on public.class_members
  for each row execute function public.class_members_check();

create function public.parent_links_check()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_parent record;
  v_student record;
begin
  select p.role, p.school_id into v_parent from public.profiles p where p.id = new.parent_id;
  select p.role, p.school_id into v_student from public.profiles p where p.id = new.student_id;
  if v_parent.role is distinct from 'parent' or v_student.role is distinct from 'student' then
    raise exception 'Liên kết phải từ tài khoản phụ huynh tới tài khoản học sinh' using errcode = '23514';
  end if;
  if v_parent.school_id is distinct from v_student.school_id then
    raise exception 'Phụ huynh và học sinh phải cùng trường' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger parent_links_check
  before insert or update on public.parent_links
  for each row execute function public.parent_links_check();

-- ---------- Tạo hồ sơ khi có user mới ----------
-- KHÔNG đọc raw_user_meta_data / raw_app_meta_data. Hồ sơ mới không có vai trò.
create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------- Hàm trợ giúp phân quyền ----------
create function public.app_current_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid());
$$;

create function public.app_current_school_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.school_id from public.profiles p where p.id = (select auth.uid());
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

create function public.is_school_admin_of(p_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'school_admin'
      and p.school_id = p_school_id
  );
$$;

create function public.is_school_admin_of_class(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.classes c
    join public.profiles p on p.school_id = c.school_id
    where c.id = p_class_id
      and p.id = (select auth.uid())
      and p.role = 'school_admin'
  );
$$;

create function public.is_class_teacher(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.class_members m
    join public.profiles p on p.id = m.user_id
    where m.class_id = p_class_id
      and m.user_id = (select auth.uid())
      and m.member_role = 'teacher'
      and p.role = 'teacher'
  );
$$;

create function public.is_class_student(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.class_members m
    join public.profiles p on p.id = m.user_id
    where m.class_id = p_class_id
      and m.user_id = (select auth.uid())
      and m.member_role = 'student'
      and p.role = 'student'
  );
$$;

create function public.is_parent_of(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.parent_links l
    join public.profiles p on p.id = l.parent_id
    where l.parent_id = (select auth.uid())
      and l.student_id = p_student_id
      and l.status = 'approved'
      and p.role = 'parent'
  );
$$;

-- Giáo viên dạy học sinh này (cùng một lớp, giáo viên là teacher của lớp)
create function public.teaches_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.class_members t
    join public.class_members s on s.class_id = t.class_id
    join public.profiles p on p.id = t.user_id
    where t.user_id = (select auth.uid())
      and t.member_role = 'teacher'
      and p.role = 'teacher'
      and s.user_id = p_student_id
      and s.member_role = 'student'
  );
$$;

-- ---------- Đọc dữ liệu tối thiểu (thay cho quyền theo cột) ----------
-- Giáo viên/quản trị trường xem danh sách học sinh của lớp: chỉ các cột cần thiết.
create function public.get_class_roster(p_class_id uuid)
returns table (user_id uuid, display_name text, student_code text, grade smallint)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name, p.student_code, p.grade
  from public.class_members m
  join public.profiles p on p.id = m.user_id
  where m.class_id = p_class_id
    and m.member_role = 'student'
    and (
      public.is_class_teacher(p_class_id)
      or public.is_school_admin_of_class(p_class_id)
      or public.is_admin()
    )
  order by p.display_name;
$$;

-- Phụ huynh xem các con ĐÃ ĐƯỢC DUYỆT liên kết.
create function public.get_my_children()
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

-- ---------- Giới hạn đăng nhập sai (chỉ server dùng service_role gọi) ----------
create function public.login_lock_status(p_key text)
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select a.locked_until
  from public.login_attempts a
  where a.key = p_key and a.locked_until > now();
$$;

-- Ghi một lần sai; trả về thời điểm hết khóa nếu vừa bị khóa (hoặc NULL).
create function public.login_record_failure(
  p_key text,
  p_max_failures integer default 5,
  p_window interval default interval '15 minutes',
  p_lock interval default interval '15 minutes'
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.login_attempts;
begin
  insert into public.login_attempts as a (key, failed_count, window_started_at, updated_at)
  values (p_key, 1, now(), now())
  on conflict (key) do update set
    failed_count = case
      when a.window_started_at < now() - p_window or a.locked_until <= now() then 1
      else a.failed_count + 1
    end,
    window_started_at = case
      when a.window_started_at < now() - p_window or a.locked_until <= now() then now()
      else a.window_started_at
    end,
    locked_until = case when a.locked_until <= now() then null else a.locked_until end,
    updated_at = now()
  returning * into v_row;

  if v_row.failed_count >= p_max_failures then
    update public.login_attempts
      set locked_until = now() + p_lock
      where key = p_key
      returning * into v_row;
  end if;

  return v_row.locked_until;
end;
$$;

create function public.login_clear(p_key text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.login_attempts where key = p_key;
$$;

-- ---------- Quyền ----------
-- Supabase mặc định cấp ALL cho anon/authenticated trên bảng mới trong public → thu hồi hết.
revoke all on table
  public.schools, public.profiles, public.classes, public.class_members,
  public.parent_links, public.login_attempts
  from public, anon, authenticated;

-- Người dùng đã đăng nhập chỉ được ĐỌC (RLS lọc hàng). login_attempts: không ai ngoài service_role.
grant select on table
  public.schools, public.profiles, public.classes, public.class_members, public.parent_links
  to authenticated;

-- Hàm: thu hồi quyền thực thi mặc định (PUBLIC, anon), chỉ cấp đúng vai trò.
revoke execute on function
  public.touch_updated_at(),
  public.profiles_guard_privileged_columns(),
  public.class_members_check(),
  public.parent_links_check(),
  public.handle_new_auth_user(),
  public.app_current_role(),
  public.app_current_school_id(),
  public.is_admin(),
  public.is_school_admin_of(uuid),
  public.is_school_admin_of_class(uuid),
  public.is_class_teacher(uuid),
  public.is_class_student(uuid),
  public.is_parent_of(uuid),
  public.teaches_student(uuid),
  public.get_class_roster(uuid),
  public.get_my_children(),
  public.login_lock_status(text),
  public.login_record_failure(text, integer, interval, interval),
  public.login_clear(text)
  from public, anon, authenticated;

grant execute on function
  public.app_current_role(),
  public.app_current_school_id(),
  public.is_admin(),
  public.is_school_admin_of(uuid),
  public.is_school_admin_of_class(uuid),
  public.is_class_teacher(uuid),
  public.is_class_student(uuid),
  public.is_parent_of(uuid),
  public.teaches_student(uuid),
  public.get_class_roster(uuid),
  public.get_my_children()
  to authenticated;

grant execute on function
  public.login_lock_status(text),
  public.login_record_failure(text, integer, interval, interval),
  public.login_clear(text)
  to service_role;

-- ---------- RLS ----------
alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.parent_links enable row level security;
alter table public.login_attempts enable row level security; -- không có policy → chỉ service_role

-- Không có policy INSERT/UPDATE/DELETE nào cho anon/authenticated (ghi qua server).

create policy schools_select on public.schools
  for select to authenticated
  using (id = (select public.app_current_school_id()) or (select public.is_admin()));

-- Hồ sơ đầy đủ: chính mình, quản trị trường của trường đó, admin hệ thống.
-- Giáo viên/phụ huynh dùng get_class_roster()/get_my_children() (chỉ cột tối thiểu).
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (select public.is_admin())
    or (school_id is not null and public.is_school_admin_of(school_id))
  );

create policy classes_select on public.classes
  for select to authenticated
  using (
    (select public.is_admin())
    or public.is_school_admin_of(school_id)
    or public.is_class_teacher(id)
    or public.is_class_student(id)
  );

-- Học sinh chỉ thấy dòng thành viên của chính mình (không liệt kê bạn cùng lớp).
create policy class_members_select on public.class_members
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_class_teacher(class_id)
    or public.is_school_admin_of_class(class_id)
    or (select public.is_admin())
  );

create policy parent_links_select on public.parent_links
  for select to authenticated
  using (
    parent_id = (select auth.uid())
    or student_id = (select auth.uid())
    or (select public.is_admin())
    or exists (
      select 1 from public.profiles s
      where s.id = parent_links.student_id
        and public.is_school_admin_of(s.school_id)
    )
  );
