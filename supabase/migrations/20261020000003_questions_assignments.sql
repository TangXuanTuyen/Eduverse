-- Bước 3A: Ngân hàng câu hỏi, bài giao, nộp bài, chấm bài
-- Tạo bảng, RLS, helper functions, grants

-- Enums
create type public.question_type as enum ('single_choice', 'multiple_choice', 'short_answer', 'essay');
create type public.late_policy as enum ('hard_lock', 'marked_late');
create type public.submission_status as enum ('draft', 'submitted', 'graded', 'published');

-- ---------------------------------------------------------------------------
-- questions: ngân hàng câu hỏi của giáo viên
-- ---------------------------------------------------------------------------
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  type public.question_type not null,
  content text not null check (char_length(content) between 1 and 10000),
  options jsonb, -- [{id:"a",text:"..."}, ...] cho trắc nghiệm
  skill_tags text[] not null default '{}',
  difficulty smallint not null default 1 check (difficulty between 1 and 3),
  explanation text not null default '' check (char_length(explanation) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index questions_owner_id_idx on public.questions(owner_id);

create trigger questions_updated_at before update on public.questions
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- question_answers: đáp án chuẩn — học sinh KHÔNG ĐƯỢC đọc
-- ---------------------------------------------------------------------------
create table public.question_answers (
  question_id uuid primary key references public.questions(id) on delete cascade,
  correct_answer jsonb, -- single: "a", multi: ["a","c"], short: ["ans1","ans2"], essay: null
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- assignments: bài giao cho phòng
-- ---------------------------------------------------------------------------
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '' check (char_length(description) <= 2000),
  due_at timestamptz,
  late_policy public.late_policy not null default 'hard_lock',
  max_retries smallint not null default 0 check (max_retries between 0 and 10),
  show_explanation_after_submit boolean not null default true,
  results_published boolean not null default false,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index assignments_room_id_idx on public.assignments(room_id);

create trigger assignments_updated_at before update on public.assignments
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- assignment_questions: snapshot câu hỏi + đáp án tại thời điểm giao
-- ---------------------------------------------------------------------------
create table public.assignment_questions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  source_question_id uuid references public.questions(id) on delete set null,
  sort_order smallint not null default 0,
  type public.question_type not null,
  content text not null,
  options jsonb,
  correct_answer jsonb,
  explanation text not null default '',
  points smallint not null default 1 check (points between 1 and 100),
  unique (assignment_id, sort_order)
);
create index aq_assignment_id_idx on public.assignment_questions(assignment_id);

-- ---------------------------------------------------------------------------
-- submissions: bài nộp
-- ---------------------------------------------------------------------------
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  attempt_number smallint not null default 1 check (attempt_number >= 1),
  status public.submission_status not null default 'draft',
  total_score numeric(6,2),
  max_score numeric(6,2),
  submitted_at timestamptz,
  graded_at timestamptz,
  graded_by uuid references public.profiles(id),
  is_late boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_id, attempt_number)
);
create index submissions_assignment_student_idx on public.submissions(assignment_id, student_id);

create trigger submissions_updated_at before update on public.submissions
  for each row execute function public.touch_updated_at();

-- Chặn status đi ngược
create or replace function public.submissions_guard_status()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_order constant text[] := array['draft','submitted','graded','published'];
begin
  if array_position(v_order, new.status::text) < array_position(v_order, old.status::text) then
    raise exception 'Không được đổi trạng thái từ % về %', old.status, new.status;
  end if;
  return new;
end;
$$;

create trigger submissions_status_guard before update of status on public.submissions
  for each row execute function public.submissions_guard_status();

-- ---------------------------------------------------------------------------
-- question_attempts: mỗi câu trả lời
-- ---------------------------------------------------------------------------
create table public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  assignment_question_id uuid not null references public.assignment_questions(id) on delete cascade,
  student_answer jsonb,
  is_correct boolean,
  score numeric(5,2),
  time_spent_seconds integer check (time_spent_seconds is null or time_spent_seconds >= 0),
  used_hint boolean not null default false,
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_id, assignment_question_id)
);
create index qa_submission_id_idx on public.question_attempts(submission_id);

create trigger question_attempts_updated_at before update on public.question_attempts
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.questions enable row level security;
alter table public.question_answers enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_questions enable row level security;
alter table public.submissions enable row level security;
alter table public.question_attempts enable row level security;

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

create function public.is_assignment_teacher(p_assignment_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.assignments a
    join public.rooms r on r.id = a.room_id
    where a.id = p_assignment_id and r.owner_id = (select auth.uid())
  );
$$;

-- Câu hỏi bài giao cho học sinh (KHÔNG có correct_answer)
create function public.get_assignment_questions_student(p_assignment_id uuid)
returns table (
  id uuid,
  sort_order smallint,
  type public.question_type,
  content text,
  options jsonb,
  explanation text,
  points smallint
)
language sql stable security definer set search_path = ''
as $$
  select aq.id, aq.sort_order, aq.type, aq.content, aq.options, aq.explanation, aq.points
  from public.assignment_questions aq
  join public.assignments a on a.id = aq.assignment_id
  where aq.assignment_id = p_assignment_id
    and public.is_room_member(a.room_id)
  order by aq.sort_order;
$$;

-- Câu hỏi bài giao cho giáo viên (CÓ correct_answer)
create function public.get_assignment_questions_teacher(p_assignment_id uuid)
returns table (
  id uuid,
  sort_order smallint,
  type public.question_type,
  content text,
  options jsonb,
  correct_answer jsonb,
  explanation text,
  points smallint,
  source_question_id uuid
)
language sql stable security definer set search_path = ''
as $$
  select aq.id, aq.sort_order, aq.type, aq.content, aq.options,
         aq.correct_answer, aq.explanation, aq.points, aq.source_question_id
  from public.assignment_questions aq
  join public.assignments a on a.id = aq.assignment_id
  where aq.assignment_id = p_assignment_id
    and a.room_id in (
      select r.id from public.rooms r where r.owner_id = (select auth.uid())
    )
  order by aq.sort_order;
$$;

-- ---------------------------------------------------------------------------
-- RLS Policies
-- ---------------------------------------------------------------------------

-- questions: GV chỉ thấy câu hỏi mình tạo
create policy questions_select on public.questions
  for select to authenticated
  using (owner_id = (select auth.uid()));

-- question_answers: KHÔNG CÓ policy — chỉ service_role đọc được

-- assignments: thành viên phòng thấy bài giao
create policy assignments_select on public.assignments
  for select to authenticated
  using (
    public.is_room_member(room_id)
    or public.is_room_owner(room_id)
  );

-- assignment_questions: KHÔNG CÓ policy — truy cập qua functions

-- submissions: HS thấy bài mình, GV thấy bài phòng mình
create policy submissions_select on public.submissions
  for select to authenticated
  using (
    student_id = (select auth.uid())
    or public.is_assignment_teacher(assignment_id)
  );

-- question_attempts: qua submission ownership
create policy question_attempts_select on public.question_attempts
  for select to authenticated
  using (
    exists (
      select 1 from public.submissions s
      where s.id = question_attempts.submission_id
      and (
        s.student_id = (select auth.uid())
        or public.is_assignment_teacher(s.assignment_id)
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke all on table
  public.questions, public.question_answers,
  public.assignments, public.assignment_questions,
  public.submissions, public.question_attempts
  from public, anon, authenticated;

grant select on table
  public.questions, public.assignments, public.submissions, public.question_attempts
  to authenticated;

-- question_answers: KHÔNG grant cho authenticated (chỉ service_role)
-- assignment_questions: KHÔNG grant cho authenticated (truy cập qua functions)

revoke execute on function
  public.submissions_guard_status(),
  public.is_assignment_teacher(uuid),
  public.get_assignment_questions_student(uuid),
  public.get_assignment_questions_teacher(uuid)
  from public, anon, authenticated, service_role;

grant execute on function
  public.is_assignment_teacher(uuid),
  public.get_assignment_questions_student(uuid),
  public.get_assignment_questions_teacher(uuid)
  to authenticated;

grant execute on function
  public.submissions_guard_status()
  to service_role;
