import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { addToReviewQueue } from '@/services/review-queue';
import { completeGameAssignment } from '@/services/game-assignments';
import {
  ROUND_SECONDS,
  REVEAL_MS,
  START_DELAY_MS,
  MIN_ROUNDS,
  applyPull,
  decideWinner,
  isInviteExpired,
  pullPower,
  roundCount,
  type Role,
} from '@/lib/duel/rules';

type Admin = ReturnType<typeof createAdminClient>;

type MatchRow = {
  id: string;
  assignment_id: string;
  room_id: string;
  host_id: string;
  guest_id: string;
  status: 'invited' | 'active' | 'finished' | 'declined' | 'cancelled' | 'expired';
  question_ids: string[];
  current_index: number;
  round_started_at: string | null;
  round_resolved_at: string | null;
  round_winner: Role | null;
  host_locked: boolean;
  guest_locked: boolean;
  host_score: number;
  guest_score: number;
  host_streak: number;
  guest_streak: number;
  host_max_streak: number;
  guest_max_streak: number;
  crystal: number;
  winner: 'host' | 'guest' | 'tie' | null;
  finalized: boolean;
  created_at: string;
};

type QuestionRow = {
  id: string;
  sort_order: number;
  content: string;
  options: { id?: string; text?: string }[] | null;
  correct_answer: unknown;
  explanation: string | null;
  source_question_id: string | null;
};

const ms = (iso: string | null) => (iso ? new Date(iso).getTime() : 0);

function correctIndexOf(q: Pick<QuestionRow, 'options' | 'correct_answer'>): number {
  const opts = Array.isArray(q.options) ? q.options : [];
  const c = q.correct_answer;
  if (typeof c === 'number') return c;
  return opts.findIndex((o) => o.id === c || o.text === c);
}

async function loadAssignment(admin: Admin, assignmentId: string) {
  const { data } = await admin
    .from('assignments')
    .select('id, title, room_id, assignment_type, game_kind, allow_friend_play')
    .eq('id', assignmentId)
    .single();
  if (!data || data.assignment_type !== 'game' || data.game_kind !== 'dau_truong') {
    throw new Error('Không tìm thấy bài giao Đấu trường ánh sáng');
  }
  return data;
}

async function isRoomStudent(admin: Admin, roomId: string, userId: string) {
  const { data: member } = await admin
    .from('room_members')
    .select('user_id')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();
  if (!member) return false;
  const { data: p } = await admin.from('profiles').select('role').eq('id', userId).single();
  return p?.role === 'student';
}

async function names(admin: Admin, ids: string[]): Promise<Map<string, string>> {
  const { data } = await admin.from('profiles').select('id, display_name').in('id', ids);
  return new Map((data ?? []).map((p) => [p.id as string, (p.display_name as string) || 'Bạn học']));
}

async function loadMatch(admin: Admin, matchId: string): Promise<MatchRow | null> {
  const { data } = await admin.from('duel_matches').select('*').eq('id', matchId).maybeSingle();
  return (data as MatchRow | null) ?? null;
}

// ---------------------------------------------------------------------------
// Mời bạn
// ---------------------------------------------------------------------------

/** Danh sách bạn cùng lớp có thể mời (chỉ tên hiển thị). */
export async function listClassmates(userId: string, assignmentId: string) {
  const admin = createAdminClient();
  const a = await loadAssignment(admin, assignmentId);
  if (!a.allow_friend_play) throw new Error('Bài giao này không cho phép đấu cùng bạn');
  if (!(await isRoomStudent(admin, a.room_id, userId))) throw new Error('Bạn không thuộc lớp này');

  const { data: members } = await admin
    .from('room_members')
    .select('user_id')
    .eq('room_id', a.room_id)
    .eq('is_active', true)
    .neq('user_id', userId);
  const ids = (members ?? []).map((m) => m.user_id as string);
  if (ids.length === 0) return [];
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, display_name, role')
    .in('id', ids)
    .eq('role', 'student');
  return (profiles ?? [])
    .map((p) => ({ id: p.id as string, name: (p.display_name as string) || 'Bạn học' }))
    .sort((x, y) => x.name.localeCompare(y.name, 'vi'));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function inviteFriend(hostId: string, assignmentId: string, guestId: string) {
  const admin = createAdminClient();
  if (!/^[0-9a-f-]{36}$/i.test(guestId)) throw new Error('Bạn được mời không hợp lệ');
  if (hostId === guestId) throw new Error('Không thể tự mời chính mình');
  const a = await loadAssignment(admin, assignmentId);
  if (!a.allow_friend_play) throw new Error('Bài giao này không cho phép đấu cùng bạn');
  if (!(await isRoomStudent(admin, a.room_id, hostId))) throw new Error('Bạn không thuộc lớp này');
  if (!(await isRoomStudent(admin, a.room_id, guestId))) throw new Error('Bạn đó không thuộc lớp này');

  const now = Date.now();
  const { data: open } = await admin
    .from('duel_matches')
    .select('id, host_id, guest_id, status, created_at, current_index, round_started_at')
    .in('status', ['invited', 'active'])
    .or(`host_id.in.(${hostId},${guestId}),guest_id.in.(${hostId},${guestId})`);
  for (const m of open ?? []) {
    const busy =
      m.status === 'active'
        ? now - ms(m.round_started_at as string | null) < 30 * 60 * 1000
        : !isInviteExpired(ms(m.created_at as string), now);
    if (!busy) continue;
    if (m.status === 'active') {
      throw new Error(
        m.host_id === hostId || m.guest_id === hostId
          ? 'Em đang trong một trận đấu'
          : 'Bạn đó đang trong một trận đấu',
      );
    }
    // Lời mời cũ do chính em gửi thì thay bằng lời mời mới
    if (m.host_id === hostId) {
      await admin.from('duel_matches').update({ status: 'cancelled' }).eq('id', m.id).eq('status', 'invited');
    } else if (m.guest_id === guestId) {
      throw new Error('Bạn đó đang có lời mời khác, thử lại sau ít phút');
    }
  }

  const { data: qs } = await admin
    .from('assignment_questions')
    .select('id, options')
    .eq('assignment_id', assignmentId)
    .order('sort_order');
  const eligible = (qs ?? []).filter((q) => Array.isArray(q.options) && q.options.length === 4);
  if (eligible.length < MIN_ROUNDS) {
    throw new Error(`Bài giao cần ít nhất ${MIN_ROUNDS} câu trắc nghiệm 4 đáp án`);
  }
  const ids = shuffle(eligible.map((q) => q.id as string)).slice(0, roundCount(eligible.length));

  const { data: created, error } = await admin
    .from('duel_matches')
    .insert({
      assignment_id: assignmentId,
      room_id: a.room_id,
      host_id: hostId,
      guest_id: guestId,
      question_ids: ids,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return { matchId: created.id as string };
}

export async function getInbox(userId: string) {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 3 * 60 * 1000).toISOString();
  const { data } = await admin
    .from('duel_matches')
    .select('id, host_id, assignment_id, created_at')
    .eq('guest_id', userId)
    .eq('status', 'invited')
    .gte('created_at', since)
    .order('created_at', { ascending: false });
  const rows = data ?? [];
  if (rows.length === 0) return [];
  const nm = await names(admin, rows.map((r) => r.host_id as string));
  const { data: asg } = await admin
    .from('assignments')
    .select('id, title')
    .in('id', rows.map((r) => r.assignment_id as string));
  const titles = new Map((asg ?? []).map((a) => [a.id as string, a.title as string]));
  return rows.map((r) => ({
    matchId: r.id as string,
    hostName: nm.get(r.host_id as string) ?? 'Bạn học',
    assignmentTitle: titles.get(r.assignment_id as string) ?? 'Đấu trường ánh sáng',
  }));
}

export async function respondInvite(userId: string, matchId: string, accept: boolean) {
  const admin = createAdminClient();
  const m = await loadMatch(admin, matchId);
  if (!m || m.guest_id !== userId) throw new Error('Không tìm thấy lời mời');
  if (m.status !== 'invited') throw new Error('Lời mời không còn hiệu lực');
  if (isInviteExpired(ms(m.created_at), Date.now())) {
    await admin.from('duel_matches').update({ status: 'expired' }).eq('id', matchId).eq('status', 'invited');
    throw new Error('Lời mời đã hết hạn');
  }
  if (!accept) {
    await admin.from('duel_matches').update({ status: 'declined' }).eq('id', matchId).eq('status', 'invited');
    return { ok: true };
  }
  const { data } = await admin
    .from('duel_matches')
    .update({
      status: 'active',
      current_index: 0,
      round_started_at: new Date(Date.now() + START_DELAY_MS).toISOString(),
    })
    .eq('id', matchId)
    .eq('status', 'invited')
    .select('id');
  if (!data || data.length === 0) throw new Error('Lời mời không còn hiệu lực');
  return { ok: true };
}

export async function cancelInvite(userId: string, matchId: string) {
  const admin = createAdminClient();
  await admin
    .from('duel_matches')
    .update({ status: 'cancelled' })
    .eq('id', matchId)
    .eq('host_id', userId)
    .eq('status', 'invited');
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Điều khiển vòng chơi (máy chủ làm trọng tài, mọi bước chuyển trạng thái có điều kiện)
// ---------------------------------------------------------------------------

async function resolveRound(admin: Admin, m: MatchRow, winner: Role | null): Promise<boolean> {
  const patch: Record<string, unknown> = {
    round_resolved_at: new Date().toISOString(),
    round_winner: winner,
  };
  if (winner) {
    const key = winner === 'host' ? 'host' : 'guest';
    const newStreak = (winner === 'host' ? m.host_streak : m.guest_streak) + 1;
    const oldMax = winner === 'host' ? m.host_max_streak : m.guest_max_streak;
    patch[`${key}_score`] = (winner === 'host' ? m.host_score : m.guest_score) + 1;
    patch[`${key}_streak`] = newStreak;
    patch[`${key}_max_streak`] = Math.max(oldMax, newStreak);
    patch.crystal = applyPull(m.crystal, winner, pullPower(newStreak));
    patch[winner === 'host' ? 'guest_streak' : 'host_streak'] = 0;
  } else {
    patch.host_streak = 0;
    patch.guest_streak = 0;
  }
  const { data } = await admin
    .from('duel_matches')
    .update(patch)
    .eq('id', m.id)
    .eq('current_index', m.current_index)
    .is('round_resolved_at', null)
    .eq('status', 'active')
    .select('id');
  return !!data && data.length > 0;
}

async function finalizeMatch(admin: Admin, m: MatchRow) {
  const { data: claimed } = await admin
    .from('duel_matches')
    .update({ finalized: true })
    .eq('id', m.id)
    .eq('finalized', false)
    .select('id');
  if (!claimed || claimed.length === 0) return;

  const { data: answers } = await admin
    .from('duel_answers')
    .select('question_id, player_id, is_correct')
    .eq('match_id', m.id);
  const { data: qs } = await admin
    .from('assignment_questions')
    .select('id, source_question_id')
    .in('id', m.question_ids);
  const source = new Map((qs ?? []).map((q) => [q.id as string, q.source_question_id as string | null]));

  for (const a of answers ?? []) {
    await admin.from('game_answer_log').upsert(
      {
        assignment_id: m.assignment_id,
        student_id: a.player_id,
        question_id: a.question_id,
        is_correct: a.is_correct,
      },
      { onConflict: 'assignment_id,student_id,question_id', ignoreDuplicates: true },
    );
    const src = source.get(a.question_id as string);
    if (!a.is_correct && src) {
      await addToReviewQueue(a.player_id as string, src).catch(() => {});
    }
  }
  for (const pid of [m.host_id, m.guest_id]) {
    await completeGameAssignment(pid, m.assignment_id).catch(() => {});
  }
}

async function finishMatch(admin: Admin, m: MatchRow) {
  await admin
    .from('duel_matches')
    .update({ status: 'finished', winner: decideWinner(m.crystal, m.host_score, m.guest_score) })
    .eq('id', m.id)
    .eq('status', 'active');
  const fresh = await loadMatch(admin, m.id);
  if (fresh) await finalizeMatch(admin, fresh);
}

async function advance(admin: Admin, m: MatchRow): Promise<MatchRow> {
  const now = Date.now();
  if (m.status === 'invited' && isInviteExpired(ms(m.created_at), now)) {
    await admin.from('duel_matches').update({ status: 'expired' }).eq('id', m.id).eq('status', 'invited');
    return { ...m, status: 'expired' };
  }
  if (m.status !== 'active' || !m.round_started_at) return m;

  if (m.round_resolved_at === null) {
    const started = ms(m.round_started_at);
    const timedOut = now > started + ROUND_SECONDS * 1000 + 1500;
    if (timedOut || (m.host_locked && m.guest_locked)) {
      await resolveRound(admin, m, null);
      return (await loadMatch(admin, m.id)) ?? m;
    }
    return m;
  }

  if (now >= ms(m.round_resolved_at) + REVEAL_MS) {
    const over = m.current_index + 1 >= m.question_ids.length || Math.abs(m.crystal) >= 100;
    if (over) {
      await finishMatch(admin, m);
    } else {
      await admin
        .from('duel_matches')
        .update({
          current_index: m.current_index + 1,
          round_started_at: new Date().toISOString(),
          round_resolved_at: null,
          round_winner: null,
          host_locked: false,
          guest_locked: false,
        })
        .eq('id', m.id)
        .eq('current_index', m.current_index)
        .not('round_resolved_at', 'is', null);
    }
    return (await loadMatch(admin, m.id)) ?? m;
  }
  return m;
}

// ---------------------------------------------------------------------------
// Trạng thái & trả lời
// ---------------------------------------------------------------------------

export type DuelSideView = { name: string; score: number; streak: number; maxStreak: number; locked: boolean };

export type DuelView = {
  serverNow: number;
  status: MatchRow['status'];
  role: Role;
  assignmentId: string;
  total: number;
  me: DuelSideView;
  opp: DuelSideView;
  crystal: number;
  index: number;
  startsInMs?: number;
  secondsLeft?: number;
  resolved?: boolean;
  roundWinner?: 'me' | 'opp' | null;
  question?: { id: string; text: string; options: string[] };
  myAnswer?: number | null;
  oppAnswered?: boolean;
  correctIndex?: number | null;
  explanation?: string | null;
  winner?: 'me' | 'opp' | 'tie';
  result?: { answered: number; correct: number; total: number; completed: boolean };
};

export async function getDuelState(userId: string, matchId: string): Promise<DuelView> {
  const admin = createAdminClient();
  let m = await loadMatch(admin, matchId);
  if (!m || (m.host_id !== userId && m.guest_id !== userId)) throw new Error('Không tìm thấy trận đấu');
  m = await advance(admin, m);

  const role: Role = m.host_id === userId ? 'host' : 'guest';
  const oppId = role === 'host' ? m.guest_id : m.host_id;
  const nm = await names(admin, [userId, oppId]);
  const mine = (k: 'score' | 'streak' | 'max_streak' | 'locked') => (m![`${role}_${k}` as keyof MatchRow] as number | boolean);
  const theirs = (k: 'score' | 'streak' | 'max_streak' | 'locked') =>
    (m![`${role === 'host' ? 'guest' : 'host'}_${k}` as keyof MatchRow] as number | boolean);

  const now = Date.now();
  const total = m.question_ids.length;
  const base = {
    serverNow: now,
    status: m.status,
    role,
    assignmentId: m.assignment_id,
    total,
    me: {
      name: nm.get(userId) ?? 'Em',
      score: mine('score') as number,
      streak: mine('streak') as number,
      maxStreak: mine('max_streak') as number,
      locked: mine('locked') as boolean,
    },
    opp: {
      name: nm.get(oppId) ?? 'Bạn học',
      score: theirs('score') as number,
      streak: theirs('streak') as number,
      maxStreak: theirs('max_streak') as number,
      locked: theirs('locked') as boolean,
    },
    // Quy ước phía người xem: âm = em đang thắng thế (đội xanh bên trái)
    crystal: role === 'host' ? m.crystal : -m.crystal,
  };

  if (m.status === 'invited' || m.status === 'declined' || m.status === 'cancelled' || m.status === 'expired') {
    return { ...base, index: 0 };
  }

  if (m.status === 'finished') {
    const { data: myAnswers } = await admin
      .from('duel_answers')
      .select('is_correct')
      .eq('match_id', m.id)
      .eq('player_id', userId);
    const { data: done } = await admin
      .from('task_completions')
      .select('id')
      .eq('assignment_id', m.assignment_id)
      .eq('student_id', userId)
      .maybeSingle();
    return {
      ...base,
      index: Math.max(0, total - 1),
      winner: m.winner === 'tie' ? 'tie' : m.winner === role ? 'me' : 'opp',
      result: {
        answered: (myAnswers ?? []).length,
        correct: (myAnswers ?? []).filter((a) => a.is_correct).length,
        total,
        completed: !!done,
      },
    };
  }

  // active
  const qid = m.question_ids[m.current_index];
  const { data: q } = await admin
    .from('assignment_questions')
    .select('id, sort_order, content, options, correct_answer, explanation, source_question_id')
    .eq('id', qid)
    .single();
  const question = q as QuestionRow;
  const { data: ans } = await admin
    .from('duel_answers')
    .select('player_id, selected_index')
    .eq('match_id', m.id)
    .eq('question_id', qid);
  const myAnswer = (ans ?? []).find((a) => a.player_id === userId);
  const oppAnswered = (ans ?? []).some((a) => a.player_id === oppId);

  const startedMs = ms(m.round_started_at);
  const resolved = m.round_resolved_at !== null;
  const startsInMs = Math.max(0, startedMs - now);
  const secondsLeft = Math.max(0, Math.ceil((startedMs + ROUND_SECONDS * 1000 - now) / 1000));

  return {
    ...base,
    index: m.current_index,
    startsInMs,
    secondsLeft: Math.min(ROUND_SECONDS, secondsLeft),
    resolved,
    roundWinner: !resolved ? null : m.round_winner === null ? null : m.round_winner === role ? 'me' : 'opp',
    question: {
      id: question.id,
      text: question.content,
      options: (question.options ?? []).map((o) => o.text ?? ''),
    },
    myAnswer: myAnswer ? (myAnswer.selected_index as number) : null,
    oppAnswered,
    // Chỉ lộ đáp án đúng sau khi câu đã khép lại
    correctIndex: resolved ? correctIndexOf(question) : null,
    explanation: resolved ? question.explanation ?? '' : null,
  };
}

export async function submitDuelAnswer(userId: string, matchId: string, index: number, selectedIndex: number) {
  const admin = createAdminClient();
  let m = await loadMatch(admin, matchId);
  if (!m || (m.host_id !== userId && m.guest_id !== userId)) throw new Error('Không tìm thấy trận đấu');
  m = await advance(admin, m);
  if (m.status !== 'active' || !m.round_started_at) throw new Error('Trận đấu chưa diễn ra');
  if (index !== m.current_index) throw new Error('Câu hỏi đã chuyển, chờ câu tiếp theo');
  if (m.round_resolved_at !== null) throw new Error('Câu này đã có kết quả');
  if (Date.now() < ms(m.round_started_at)) throw new Error('Trận chưa bắt đầu');
  if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex > 3) throw new Error('Đáp án không hợp lệ');

  const role: Role = m.host_id === userId ? 'host' : 'guest';
  if ((role === 'host' ? m.host_locked : m.guest_locked)) throw new Error('Em đã trả lời sai câu này, chờ bạn trả lời');

  const qid = m.question_ids[m.current_index];
  const { data: q } = await admin
    .from('assignment_questions')
    .select('id, options, correct_answer')
    .eq('id', qid)
    .single();
  const isCorrect = correctIndexOf(q as Pick<QuestionRow, 'options' | 'correct_answer'>) === selectedIndex;

  const { error: insErr } = await admin.from('duel_answers').insert({
    match_id: m.id,
    question_id: qid,
    player_id: userId,
    selected_index: selectedIndex,
    is_correct: isCorrect,
  });
  if (insErr) {
    if (insErr.code === '23505') throw new Error('Em đã trả lời câu này rồi');
    throw new Error(insErr.message);
  }

  if (isCorrect) {
    await resolveRound(admin, m, role);
  } else {
    await admin
      .from('duel_matches')
      .update(role === 'host' ? { host_locked: true, host_streak: 0 } : { guest_locked: true, guest_streak: 0 })
      .eq('id', m.id)
      .eq('current_index', m.current_index)
      .is('round_resolved_at', null);
    const fresh = await loadMatch(admin, m.id);
    if (fresh) await advance(admin, fresh);
  }
  return { isCorrect };
}
