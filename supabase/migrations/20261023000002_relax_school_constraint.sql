-- Cho phép student và parent có school_id NULL (join lớp/trường sau)
-- Chỉ chạy khi bảng profiles đã có cột school_id (migration core đã áp)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'school_id'
  ) then
    execute 'alter table public.profiles drop constraint if exists profiles_role_needs_school';
    execute $c$alter table public.profiles
      add constraint profiles_role_needs_school
        check (role is null or role in ('admin', 'student', 'parent') or school_id is not null)$c$;
  end if;
end $$;
