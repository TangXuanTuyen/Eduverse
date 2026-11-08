-- Hàm mặc định cho PUBLIC thực thi; revoke riêng anon không đủ.
-- Thu hồi từ PUBLIC rồi cấp lại đúng vai trò.
revoke execute on function public.get_class_leaderboard(uuid) from public, anon;
grant execute on function public.get_class_leaderboard(uuid) to authenticated;

revoke execute on function public.upsert_student_progress(uuid, smallint, int, int, int, int, text[]) from public, anon, authenticated;
grant execute on function public.upsert_student_progress(uuid, smallint, int, int, int, int, text[]) to service_role;
