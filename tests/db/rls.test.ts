/**
 * Kiểm thử phân quyền ở tầng CSDL (RLS + GRANT + hàm security definer).
 * Chạy migration thật trên Postgres nhúng (PGlite) với các vai trò giống Supabase.
 */
import { beforeAll, describe, expect, test } from 'vitest';
import type { PGlite, Transaction } from '@electric-sql/pglite';
import { anon, as, createTestDb, service, user } from './harness';
import { ids, seedFixtures } from './fixtures';

let db: PGlite;

beforeAll(async () => {
  db = await createTestDb();
  await seedFixtures(db);
}, 120_000);

const TABLES = [
  'profiles', 'rooms', 'room_members', 'parent_links', 'notifications', 'login_attempts',
  'questions', 'question_answers', 'assignments', 'assignment_questions',
  'submissions', 'question_attempts',
];

async function rows<T = Record<string, unknown>>(tx: Transaction, sql: string, params: unknown[] = []) {
  return (await tx.query<T>(sql, params)).rows;
}

async function expectDenied(fn: () => Promise<unknown>) {
  await expect(fn()).rejects.toThrow(/permission denied|không được|violates row-level security/i);
}

// ---------------------------------------------------------------------------
describe('Khóa anon: không đọc được gì', () => {
  test.each(TABLES)('anon không SELECT được bảng %s', async (table) => {
    await expectDenied(() => as(db, anon, (tx) => rows(tx, `select * from public.${table}`)));
  });

  test('mọi hàm trong public đều không cho anon thực thi', async () => {
    const r = await db.query<{ proname: string }>(`
      select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')`);
    expect(r.rows.map((x) => x.proname)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
describe('Học sinh A1 chỉ thấy dữ liệu phòng mình', () => {
  const asA1 = user(ids.studentA1);

  test('thấy hồ sơ bạn cùng phòng (qua room membership), không thấy phòng khác', async () => {
    const r = await as(db, asA1, (tx) => rows<{ id: string }>(tx, 'select id from public.profiles'));
    const visibleIds = r.map((x) => x.id).sort();
    expect(visibleIds).toContain(ids.studentA1);
    expect(visibleIds).toContain(ids.studentA2);
    expect(visibleIds).toContain(ids.teacher1);
    expect(visibleIds).not.toContain(ids.studentB1);
    expect(visibleIds).not.toContain(ids.teacher2);
  });

  test('thấy phòng mình tham gia, không thấy phòng khác', async () => {
    const r = await as(db, asA1, (tx) => rows<{ id: string }>(tx, 'select id from public.rooms'));
    expect(r.map((x) => x.id)).toEqual([ids.room1]);
  });

  test('thấy tất cả thành viên phòng mình', async () => {
    const r = await as(db, asA1, (tx) =>
      rows<{ user_id: string }>(tx, 'select user_id from public.room_members order by user_id')
    );
    const memberIds = r.map((x) => x.user_id);
    expect(memberIds).toContain(ids.studentA1);
    expect(memberIds).toContain(ids.studentA2);
    expect(memberIds).toContain(ids.teacher1);
    expect(memberIds).not.toContain(ids.studentB1);
  });

  test('không thấy liên kết phụ huynh của học sinh khác', async () => {
    const r = await as(db, user(ids.studentA2), (tx) =>
      rows<{ student_id: string }>(tx, 'select student_id from public.parent_links')
    );
    expect(r.every((x) => x.student_id === ids.studentA2)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
describe('Không ai tự nâng vai trò', () => {
  const attackers = [ids.studentA1, ids.teacher1, ids.parentApproved, ids.noRole];

  test.each(attackers)('%s không UPDATE được role', async (uid) => {
    await expectDenied(() =>
      as(db, user(uid), (tx) => rows(tx, `update public.profiles set role = 'teacher' where id = $1`, [uid]))
    );
  });

  test.each(attackers)('%s không INSERT/DELETE hồ sơ', async (uid) => {
    await expectDenied(() =>
      as(db, user(uid), (tx) =>
        rows(tx, `insert into public.profiles (id, role) values ($1, 'teacher') on conflict (id) do update set role = 'teacher'`, [uid])
      )
    );
    await expectDenied(() => as(db, user(uid), (tx) => rows(tx, 'delete from public.profiles where id = $1', [uid])));
  });

  test('học sinh không tự thêm mình vào phòng, không tự tạo phòng', async () => {
    await expectDenied(() =>
      as(db, user(ids.studentA1), (tx) =>
        rows(tx, `insert into public.room_members (room_id, user_id) values ($1, $2)`, [ids.room2, ids.studentA1])
      )
    );
    await expectDenied(() =>
      as(db, user(ids.studentA1), (tx) =>
        rows(tx, `insert into public.rooms (name, owner_id) values ('hack', $1)`, [ids.studentA1])
      )
    );
  });

  test('phụ huynh không tự duyệt liên kết', async () => {
    await expectDenied(() =>
      as(db, user(ids.parentPending), (tx) =>
        rows(tx, `update public.parent_links set status = 'approved' where parent_id = $1`, [ids.parentPending])
      )
    );
  });

  test('không gọi được hàm nội bộ từ tài khoản thường', async () => {
    for (const sql of [
      `select public.login_clear('id:${'0'.repeat(64)}')`,
      `select public.login_record_failure('id:${'0'.repeat(64)}')`,
    ]) {
      await expectDenied(() => as(db, user(ids.studentA1), (tx) => rows(tx, sql)));
    }
  });

  test('phòng thủ hai lớp: trigger chặn đổi vai trò kể cả khi lỡ cấp UPDATE', async () => {
    await db.exec(`
      grant update on public.profiles to authenticated;
      create policy tmp_update_own on public.profiles for update to authenticated
        using (id = auth.uid()) with check (id = auth.uid());
    `);
    try {
      await expectDenied(() =>
        as(db, user(ids.studentA1), (tx) =>
          rows(tx, `update public.profiles set role = 'teacher' where id = $1`, [ids.studentA1])
        )
      );
      const ok = await as(db, user(ids.studentA1), (tx) =>
        rows(tx, `update public.profiles set display_name = 'Tên mới' where id = $1 returning id`, [ids.studentA1])
      );
      expect(ok).toHaveLength(1);
    } finally {
      await db.exec(`
        drop policy tmp_update_own on public.profiles;
        revoke update on public.profiles from authenticated;
      `);
    }
  });
});

// ---------------------------------------------------------------------------
describe('Phụ huynh', () => {
  test('phụ huynh đã duyệt thấy con', async () => {
    const r = await as(db, user(ids.parentApproved), (tx) => rows(tx, 'select * from public.get_my_children()'));
    expect(r).toEqual([{ student_id: ids.studentA1, display_name: 'HS A1', grade: 6 }]);
  });

  test('phụ huynh chưa duyệt không thấy con', async () => {
    const children = await as(db, user(ids.parentPending), (tx) => rows(tx, 'select * from public.get_my_children()'));
    expect(children).toEqual([]);
  });

  test('phụ huynh thấy trạng thái liên kết của mình', async () => {
    const r = await as(db, user(ids.parentPending), (tx) =>
      rows<{ status: string }>(tx, 'select status from public.parent_links')
    );
    expect(r).toEqual([{ status: 'pending' }]);
  });
});

// ---------------------------------------------------------------------------
describe('Giáo viên', () => {
  test('xem danh sách học sinh phòng mình', async () => {
    const r = await as(db, user(ids.teacher1), (tx) =>
      rows(tx, 'select * from public.get_room_roster($1)', [ids.room1])
    );
    expect(r.map((x) => (x as { user_id: string }).user_id).sort()).toEqual([ids.studentA1, ids.studentA2].sort());
  });

  test('không xem được phòng mình không sở hữu', async () => {
    const roster = await as(db, user(ids.teacher1), (tx) =>
      rows(tx, 'select * from public.get_room_roster($1)', [ids.room2])
    );
    expect(roster).toEqual([]);
  });

  test('thấy phòng mình sở hữu hoặc tham gia', async () => {
    const r = await as(db, user(ids.teacher1), (tx) => rows<{ id: string }>(tx, 'select id from public.rooms'));
    expect(r.map((x) => x.id)).toEqual([ids.room1]);
  });

  test('thấy thành viên phòng mình (vì là owner)', async () => {
    const r = await as(db, user(ids.teacher1), (tx) =>
      rows<{ user_id: string }>(tx, 'select user_id from public.room_members where room_id = $1', [ids.room1])
    );
    expect(r.length).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
describe('join_room RPC', () => {
  test('học sinh tham gia phòng bằng mã đúng', async () => {
    const r = await as(db, user(ids.studentB1), (tx) =>
      rows<{ join_room: string }>(tx, "select public.join_room('ABCDEF')")
    );
    expect(r[0].join_room).toBe(ids.room1);
  });

  test('mã sai → lỗi', async () => {
    await expect(
      as(db, user(ids.studentA1), (tx) => rows(tx, "select public.join_room('ZZZZZZ')"))
    ).rejects.toThrow(/không hợp lệ/i);
  });

  test('giáo viên không dùng join_room được', async () => {
    await expect(
      as(db, user(ids.teacher1), (tx) => rows(tx, "select public.join_room('GHJKLM')"))
    ).rejects.toThrow(/chỉ học sinh/i);
  });
});

// ---------------------------------------------------------------------------
describe('Thông báo', () => {
  test('chỉ thấy thông báo của mình', async () => {
    // Insert as superuser (not via `as` which rolls back)
    await db.query(
      `insert into public.notifications (user_id, type, title) values ($1, 'test', 'Cho A1'), ($2, 'test', 'Cho B1')`,
      [ids.studentA1, ids.studentB1]
    );
    const r = await as(db, user(ids.studentA1), (tx) =>
      rows<{ title: string }>(tx, 'select title from public.notifications')
    );
    expect(r.map((x) => x.title)).toEqual(['Cho A1']);
  });
});

// ---------------------------------------------------------------------------
describe('Tài khoản chưa có vai trò', () => {
  test('chỉ thấy hồ sơ mình', async () => {
    const r = await as(db, user(ids.noRole), (tx) => rows<{ id: string }>(tx, 'select id from public.profiles'));
    expect(r.map((x) => x.id)).toEqual([ids.noRole]);
  });
  test('không thấy phòng nào', async () => {
    const r = await as(db, user(ids.noRole), (tx) => rows(tx, 'select * from public.rooms'));
    expect(r).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
describe('Đáp án: học sinh không đọc được', () => {
  test('question_answers: permission denied', async () => {
    await expectDenied(() =>
      as(db, user(ids.studentA1), (tx) => rows(tx, 'select * from public.question_answers'))
    );
  });

  test('assignment_questions: permission denied (phải dùng function)', async () => {
    await expectDenied(() =>
      as(db, user(ids.studentA1), (tx) => rows(tx, 'select * from public.assignment_questions'))
    );
  });

  test('get_assignment_questions_student trả về không có correct_answer', async () => {
    const r = await as(db, user(ids.studentA1), (tx) =>
      rows(tx, 'select * from public.get_assignment_questions_student($1)', [ids.assignment1])
    );
    expect(r.length).toBe(2);
    for (const q of r) {
      expect(q).not.toHaveProperty('correct_answer');
    }
  });

  test('get_assignment_questions_student: HS không thấy bài phòng khác', async () => {
    const r = await as(db, user(ids.studentA1), (tx) =>
      rows(tx, 'select * from public.get_assignment_questions_student($1)', [ids.assignment2])
    );
    expect(r).toEqual([]);
  });

  test('get_assignment_questions_teacher: GV thấy correct_answer', async () => {
    const r = await as(db, user(ids.teacher1), (tx) =>
      rows(tx, 'select * from public.get_assignment_questions_teacher($1)', [ids.assignment1])
    );
    expect(r.length).toBe(2);
    expect(r[0]).toHaveProperty('correct_answer');
  });

  test('get_assignment_questions_teacher: GV không thấy bài phòng khác', async () => {
    const r = await as(db, user(ids.teacher1), (tx) =>
      rows(tx, 'select * from public.get_assignment_questions_teacher($1)', [ids.assignment2])
    );
    expect(r).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
describe('Câu hỏi và bài giao: phân quyền', () => {
  test('GV chỉ thấy câu hỏi mình tạo', async () => {
    const r = await as(db, user(ids.teacher1), (tx) =>
      rows<{ id: string }>(tx, 'select id from public.questions')
    );
    const qIds = r.map((x) => x.id);
    expect(qIds).toContain(ids.question1);
    expect(qIds).toContain(ids.question2);
    expect(qIds).not.toContain(ids.question3);
  });

  test('HS không thấy câu hỏi nào trong ngân hàng', async () => {
    const r = await as(db, user(ids.studentA1), (tx) =>
      rows(tx, 'select * from public.questions')
    );
    expect(r).toEqual([]);
  });

  test('HS thấy bài giao phòng mình, không thấy phòng khác', async () => {
    const r = await as(db, user(ids.studentA1), (tx) =>
      rows<{ id: string }>(tx, 'select id from public.assignments')
    );
    expect(r.map((x) => x.id)).toEqual([ids.assignment1]);
  });

  test('HS thấy submission mình, không thấy của bạn', async () => {
    const r = await as(db, user(ids.studentA1), (tx) =>
      rows<{ id: string }>(tx, 'select id from public.submissions')
    );
    expect(r.map((x) => x.id)).toEqual([ids.submission1]);

    const r2 = await as(db, user(ids.studentA2), (tx) =>
      rows(tx, 'select * from public.submissions')
    );
    expect(r2).toEqual([]);
  });

  test('GV thấy submissions phòng mình', async () => {
    const r = await as(db, user(ids.teacher1), (tx) =>
      rows<{ id: string }>(tx, 'select id from public.submissions')
    );
    expect(r.map((x) => x.id)).toContain(ids.submission1);
  });

  test('GV không thấy submissions phòng khác', async () => {
    const r = await as(db, user(ids.teacher2), (tx) =>
      rows<{ student_id: string }>(tx, `select student_id from public.submissions
        where assignment_id = $1`, [ids.assignment1])
    );
    expect(r).toEqual([]);
  });

  test('HS thấy question_attempts mình', async () => {
    const r = await as(db, user(ids.studentA1), (tx) =>
      rows<{ id: string }>(tx, 'select id from public.question_attempts')
    );
    expect(r.map((x) => x.id)).toEqual([ids.attempt1]);
  });

  test('HS không INSERT/UPDATE bảng bài giao', async () => {
    await expectDenied(() =>
      as(db, user(ids.studentA1), (tx) =>
        rows(tx, `insert into public.submissions (assignment_id, student_id) values ($1, $2)`,
          [ids.assignment1, ids.studentA1])
      )
    );
    await expectDenied(() =>
      as(db, user(ids.studentA1), (tx) =>
        rows(tx, `update public.submissions set total_score = 100 where id = $1`, [ids.submission1])
      )
    );
  });
});

// ---------------------------------------------------------------------------
describe('Giới hạn đăng nhập sai (service_role)', () => {
  const key = `id:${'a'.repeat(64)}`;

  test('khóa sau 5 lần sai, mở lại khi xóa', async () => {
    await as(db, service, async (tx) => {
      for (let i = 1; i <= 4; i++) {
        const r = await rows<{ v: string | null }>(tx, 'select public.login_record_failure($1) v', [key]);
        expect(r[0].v).toBeNull();
      }
      const fifth = await rows<{ v: string | null }>(tx, 'select public.login_record_failure($1) v', [key]);
      expect(fifth[0].v).not.toBeNull();
      await tx.query('select public.login_clear($1)', [key]);
      const cleared = await rows<{ v: string | null }>(tx, 'select public.login_lock_status($1) v', [key]);
      expect(cleared[0].v).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
describe('Quy tắc chung cho mọi bảng/hàm', () => {
  test('mọi bảng trong public đều bật RLS', async () => {
    const r = await db.query<{ relname: string }>(`
      select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`);
    expect(r.rows).toEqual([]);
  });

  test('anon không có quyền nào trên bảng trong public', async () => {
    const r = await db.query<{ table_name: string; privilege_type: string }>(`
      select table_name, privilege_type from information_schema.role_table_grants
      where table_schema = 'public' and grantee in ('anon', 'PUBLIC')`);
    expect(r.rows).toEqual([]);
  });

  test('authenticated chỉ có quyền SELECT', async () => {
    const r = await db.query<{ table_name: string; privilege_type: string }>(`
      select table_name, privilege_type from information_schema.role_table_grants
      where table_schema = 'public' and grantee = 'authenticated' and privilege_type <> 'SELECT'`);
    expect(r.rows).toEqual([]);
  });

  test("mọi hàm security definer đều có search_path = ''", async () => {
    const r = await db.query<{ proname: string; proconfig: string[] | null }>(`
      select p.proname, p.proconfig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.prosecdef`);
    const bad = r.rows.filter((x) => !(x.proconfig ?? []).some((c) => c === 'search_path=""' || c === "search_path=''"));
    expect(bad.map((x) => x.proname)).toEqual([]);
    expect(r.rows.length).toBeGreaterThan(3);
  });
});
