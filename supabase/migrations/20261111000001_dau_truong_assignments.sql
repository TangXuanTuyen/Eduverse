-- Đấu trường ánh sáng: loại trò chơi của bài giao + nhật ký câu trả lời để máy chủ xác nhận hoàn thành

-- 1. Bài giao dạng trò chơi: chọn trò chơi và cho phép mời bạn (dùng ở bước sau)
alter table public.assignments
  add column if not exists game_kind text
    check (game_kind is null or game_kind in ('me_cung', 'dau_truong')),
  add column if not exists allow_friend_play boolean not null default false;

update public.assignments set game_kind = 'me_cung'
  where assignment_type = 'game' and game_kind is null;

-- 2. Nhật ký câu trả lời trong bài giao trò chơi (chỉ máy chủ ghi; câu đầu tiên được tính)
create table if not exists public.game_answer_log (
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.assignment_questions(id) on delete cascade,
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  primary key (assignment_id, student_id, question_id)
);

alter table public.game_answer_log enable row level security;
revoke all on public.game_answer_log from anon, authenticated, public;
grant select on public.game_answer_log to authenticated;

-- Học sinh chỉ đọc nhật ký của mình; ghi chỉ qua máy chủ (service_role)
create policy "student_select_own_game_answer_log"
  on public.game_answer_log for select to authenticated
  using (student_id = auth.uid());

comment on table public.game_answer_log is 'Câu trả lời của học sinh trong bài giao trò chơi; máy chủ chấm và ghi, dùng để xác nhận hoàn thành';
