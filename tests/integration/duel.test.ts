/**
 * Kiểm thử tích hợp: đấu 2 bạn cùng lớp (Đấu trường ánh sáng) với Supabase thật.
 * Cần đã chạy migration 20261111000001/2. Chạy: npm run test:integration
 */
import { randomBytes } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

try {
  process.loadEnvFile('.env.local');
} catch {}

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const configured = Boolean(URL_ && SERVICE);
const noSession = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const tag = randomBytes(3).toString('hex');

describe.skipIf(!configured)('Đấu 2 bạn: luồng mời, trả lời, kết thúc', () => {
  let admin: SupabaseClient;
  const ids: Record<string, string> = {};
  let roomId = '';
  let assignmentId = '';
  let duels: typeof import('@/services/duels');

  beforeAll(async () => {
    admin = createClient(URL_, SERVICE, noSession);
    duels = await import('@/services/duels');

    for (const [key, role] of [['T', 'teacher'], ['A', 'student'], ['B', 'student'], ['C', 'student']] as const) {
      const { data, error } = await admin.auth.admin.createUser({
        email: `duel.${key.toLowerCase()}.${tag}@example.com`,
        password: 'TestPass' + randomBytes(4).toString('hex'),
        email_confirm: true,
        user_metadata: { full_name: `Duel ${key} ${tag}` },
      });
      if (error) throw error;
      await admin.from('profiles').update({ role, display_name: `Duel ${key} ${tag}`, grade: role === 'student' ? 6 : null }).eq('id', data.user.id);
      ids[key] = data.user.id;
    }
    const { data: code } = await admin.rpc('generate_join_code');
    const { data: room, error: re } = await admin
      .from('rooms')
      .insert({ name: `Duel ${tag}`, grade: 6, owner_id: ids.T, join_code: code })
      .select('id')
      .single();
    if (re) throw re;
    roomId = room.id;
    await admin.from('room_members').insert(['T', 'A', 'B'].map((k) => ({ room_id: roomId, user_id: ids[k] })));

    const { data: a, error: ae } = await admin
      .from('assignments')
      .insert({
        room_id: roomId,
        title: `Duel ${tag}`,
        assignment_type: 'game',
        game_kind: 'dau_truong',
        allow_friend_play: true,
        created_by: ids.T,
      })
      .select('id')
      .single();
    if (ae) throw ae;
    assignmentId = a.id;
    const qs = [0, 1, 2, 3].map((i) => ({
      assignment_id: assignmentId,
      sort_order: i,
      type: 'single_choice',
      content: `Câu ${i + 1}`,
      options: ['A', 'B', 'C', 'D'].map((id) => ({ id, text: `Đáp án ${id}` })),
      correct_answer: 'B',
      explanation: 'Vì B đúng',
      points: 1,
    }));
    const { error: qe } = await admin.from('assignment_questions').insert(qs);
    if (qe) throw qe;
  }, 60_000);

  afterAll(async () => {
    if (!admin) return;
    if (roomId) await admin.from('rooms').delete().eq('id', roomId);
    for (const id of Object.values(ids)) await admin.auth.admin.deleteUser(id);
  }, 60_000);

  test('chỉ mời được bạn cùng lớp; không mời người ngoài lớp', async () => {
    const list = await duels.listClassmates(ids.A, assignmentId);
    expect(list.map((m) => m.id)).toEqual([ids.B]);
    await expect(duels.inviteFriend(ids.A, assignmentId, ids.C)).rejects.toThrow();
  });

  test('mời → chấp nhận → trả lời → kết thúc, câu sai vào Trạm Sửa Lỗi', async () => {
    const { matchId } = await duels.inviteFriend(ids.A, assignmentId, ids.B);
    const inbox = await duels.getInbox(ids.B);
    expect(inbox.map((i) => i.matchId)).toContain(matchId);

    // Người ngoài trận không đọc được trạng thái
    await expect(duels.getDuelState(ids.C, matchId)).rejects.toThrow();
    // Chưa chấp nhận thì chưa trả lời được
    await expect(duels.submitDuelAnswer(ids.A, matchId, 0, 1)).rejects.toThrow();

    await duels.respondInvite(ids.B, matchId, true);
    // Đẩy mốc bắt đầu về quá khứ để không phải chờ đếm ngược
    await admin.from('duel_matches').update({ round_started_at: new Date(Date.now() - 1000).toISOString() }).eq('id', matchId);

    const s0 = await duels.getDuelState(ids.A, matchId);
    expect(s0.status).toBe('active');
    expect(s0.correctIndex).toBeNull(); // không lộ đáp án trước khi hết câu

    // A trả lời sai (A), B trả lời đúng (B) → B thắng câu
    const wrong = await duels.submitDuelAnswer(ids.A, matchId, 0, 0);
    expect(wrong.isCorrect).toBe(false);
    await expect(duels.submitDuelAnswer(ids.A, matchId, 0, 1)).rejects.toThrow(); // một lần mỗi câu
    const right = await duels.submitDuelAnswer(ids.B, matchId, 0, 1);
    expect(right.isCorrect).toBe(true);

    const s1 = await duels.getDuelState(ids.B, matchId);
    expect(s1.resolved).toBe(true);
    expect(s1.roundWinner).toBe('me');
    expect(s1.correctIndex).toBe(1);
    expect(s1.crystal).toBeGreaterThan(0 - 100); // pha lê đã dịch
    const sA = await duels.getDuelState(ids.A, matchId);
    expect(sA.roundWinner).toBe('opp');

    // Phần còn lại: ép các câu khép lại nhanh để kết thúc trận
    for (let i = 1; i < 4; i++) {
      await admin
        .from('duel_matches')
        .update({ round_resolved_at: new Date(Date.now() - 10_000).toISOString() })
        .eq('id', matchId);
      await duels.getDuelState(ids.A, matchId); // sang câu kế
      await admin.from('duel_matches').update({ round_started_at: new Date(Date.now() - 1000).toISOString() }).eq('id', matchId);
      await duels.submitDuelAnswer(ids.B, matchId, i, 1);
    }
    await admin
      .from('duel_matches')
      .update({ round_resolved_at: new Date(Date.now() - 10_000).toISOString() })
      .eq('id', matchId);
    const end = await duels.getDuelState(ids.B, matchId);
    expect(end.status).toBe('finished');
    expect(end.winner).toBe('me');
    const endA = await duels.getDuelState(ids.A, matchId);
    expect(endA.winner).toBe('opp');

    // Câu A trả lời sai đã vào Trạm Sửa Lỗi? (chỉ khi câu có source_question_id; ở đây không có) → nhật ký có ghi
    const { data: log } = await admin.from('game_answer_log').select('is_correct').eq('student_id', ids.A).eq('assignment_id', assignmentId);
    expect((log ?? []).length).toBe(1);
    expect(log![0].is_correct).toBe(false);
    const { data: logB } = await admin.from('game_answer_log').select('is_correct').eq('student_id', ids.B).eq('assignment_id', assignmentId);
    expect((logB ?? []).length).toBe(4);
  }, 60_000);
});
