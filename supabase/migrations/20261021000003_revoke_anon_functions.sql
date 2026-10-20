-- Bước 10: Rà soát bảo mật — thu hồi quyền anon/public trên các hàm thiếu

-- game functions (migration 0005 chỉ grant cho service_role/authenticated, nhưng chưa revoke public)
REVOKE ALL ON FUNCTION public.generate_game_join_code() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_game_join_code() TO service_role;

REVOKE ALL ON FUNCTION public.is_game_session_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_game_session_owner(uuid) TO authenticated;

-- audit log (migration 0012 revoke nhưng increment_ai_usage thiếu)
REVOKE ALL ON FUNCTION public.create_audit_log(uuid, text, text, uuid, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_audit_log(uuid, text, text, uuid, jsonb, text) TO service_role;

-- ai usage (migration ai_tutor đã revoke nhưng PUBLIC vẫn có quyền)
REVOKE ALL ON FUNCTION public.increment_ai_usage(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_ai_usage(uuid, integer) TO authenticated;
