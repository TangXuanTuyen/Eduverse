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

const TABLES = ['schools', 'profiles', 'classes', 'class_members', 'parent_links', 'login_attempts'];

async function rows<T = Record<string, unknown>>(tx: Transaction, sql: string, params: unknown[] = []) {
  return (await tx.query<T>(sql, params)).rows;
}

async function expectDenied(fn: () => Promise<unknown>) {
  await expect(fn()).rejects.toThrow(/permission denied|không được|violates row-level security/i);
}

// ---------------------------------------------------------------------------
describe('Khóa anon, không đăng nhập: không đọc được gì', () => {
  test.each(TABLES)('anon không SELECT được bảng %s', async (table) => {
    await expectDenied(() => as(db, anon, (tx) => rows(tx, `select * from public.${table}`)));
  });

  test.each([
    'select public.app_current_role()',
    `select * from public.get_class_roster('${ids.class6A1}')`,
    'select * from public.get_my_children()',
    `select public.is_parent_of('${ids.studentA1}')`,
    `select public.login_lock_status('id:${'0'.repeat(64)}')`,
  ])('anon không gọi được hàm: %s', async (sql) => {
    await expectDenied(() => as(db, anon, (tx) => rows(tx, sql)));
  });

  test('mọi hàm trong public đều không cho anon thực thi', async () => {
    const r = await db.query<{ proname: string }>(`
      select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')`);
    expect(r.rows.map((x) => x.proname)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
describe('Học sinh A không đọc được dữ liệu của học sinh B hoặc lớp khác', () => {
  const asA1 = user(ids.studentA1);

  test('chỉ thấy hồ sơ của chính mình', async () => {
    const r = await as(db, asA1, (tx) => rows<{ id: string }>(tx, 'select id from public.profiles'));
    expect(r.map((x) => x.id)).toEqual([ids.studentA1]);
  });

  test('không đọc được hồ sơ bạn cùng lớp, học sinh lớp khác, trường khác', async () => {
    for (const other of [ids.studentA2, ids.studentA3, ids.studentB1, ids.teacher1]) {
      const r = await as(db, asA1, (tx) => rows(tx, 'select * from public.profiles where id = $1', [other]));
      expect(r).toEqual([]);
    }
  });

  test('chỉ thấy lớp của mình', async () => {
    const r = await as(db, asA1, (tx) => rows<{ id: string }>(tx, 'select id from public.classes'));
    expect(r.map((x) => x.id)).toEqual([ids.class6A1]);
  });

  test('không liệt kê được thành viên lớp (chỉ dòng của chính mình)', async () => {
    const r = await as(db, asA1, (tx) =>
      rows<{ user_id: string }>(tx, 'select user_id from public.class_members')
    );
    expect(r.map((x) => x.user_id)).toEqual([ids.studentA1]);
  });

  test('không dùng được danh sách lớp dành cho giáo viên', async () => {
    const r = await as(db, asA1, (tx) => rows(tx, 'select * from public.get_class_roster($1)', [ids.class6A1]));
    expect(r).toEqual([]);
  });

  test('chỉ thấy trường của mình', async () => {
    const r = await as(db, asA1, (tx) => rows<{ id: string }>(tx, 'select id from public.schools'));
    expect(r.map((x) => x.id)).toEqual([ids.schoolA]);
  });

  test('không thấy liên kết phụ huynh của học sinh khác', async () => {
    const r = await as(db, user(ids.studentA2), (tx) =>
      rows<{ student_id: string }>(tx, 'select student_id from public.parent_links')
    );
    expect(r.every((x) => x.student_id === ids.studentA2)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
describe('Không ai tự nâng vai trò được, bằng bất kỳ truy vấn nào', () => {
  const attackers = [ids.studentA1, ids.teacher1, ids.parentApproved, ids.noRole, ids.schoolAdminA];

  test.each(attackers)('%s không UPDATE được role/school_id/student_code', async (uid) => {
    for (const sql of [
      `update public.profiles set role = 'admin' where id = $1`,
      `update public.profiles set school_id = '${ids.schoolB}' where id = $1`,
      `update public.profiles set student_code = 'HACK0001' where id = $1`,
      `update public.profiles set must_change_password = false where id = $1`,
      `update public.profiles set display_name = 'x' where id = $1`,
    ]) {
      await expectDenied(() => as(db, user(uid), (tx) => rows(tx, sql, [uid])));
    }
  });

  test.each(attackers)('%s không INSERT/UPSERT/DELETE được hồ sơ', async (uid) => {
    await expectDenied(() =>
      as(db, user(uid), (tx) =>
        rows(
          tx,
          `insert into public.profiles (id, role) values ($1, 'admin')
           on conflict (id) do update set role = 'admin'`,
          [uid]
        )
      )
    );
    await expectDenied(() => as(db, user(uid), (tx) => rows(tx, 'delete from public.profiles where id = $1', [uid])));
  });

  test('học sinh không tự vào lớp, không tự tạo/duyệt liên kết phụ huynh, không tạo lớp', async () => {
    const asA1 = user(ids.studentA1);
    await expectDenied(() =>
      as(db, asA1, (tx) =>
        rows(tx, `insert into public.class_members (class_id, user_id, member_role) values ($1, $2, 'teacher')`, [
          ids.class6A2,
          ids.studentA1,
        ])
      )
    );
    await expectDenied(() =>
      as(db, asA1, (tx) =>
        rows(tx, `insert into public.classes (school_id, name, grade, school_year) values ($1, 'X', 6, '2026-2027')`, [
          ids.schoolA,
        ])
      )
    );
    await expectDenied(() =>
      as(db, user(ids.parentPending), (tx) =>
        rows(tx, `update public.parent_links set status = 'approved' where parent_id = $1`, [ids.parentPending])
      )
    );
  });

  test('không gọi được hàm nội bộ (khóa đăng nhập, trigger) từ tài khoản thường', async () => {
    for (const sql of [
      `select public.login_clear('id:${'0'.repeat(64)}')`,
      `select public.login_record_failure('id:${'0'.repeat(64)}')`,
      'select public.handle_new_auth_user()',
    ]) {
      await expectDenied(() => as(db, user(ids.studentA1), (tx) => rows(tx, sql)));
    }
  });

  test('metadata do người dùng tự đặt ("role":"admin") không tạo ra quyền', async () => {
    const r = await db.query<{ role: string | null }>('select role from public.profiles where id = $1', [ids.noRole]);
    expect(r.rows[0].role).toBeNull();
    const isAdmin = await as(db, user(ids.noRole), (tx) =>
      rows<{ v: boolean }>(tx, 'select public.is_admin() as v')
    );
    expect(isAdmin[0].v).toBe(false);
  });

  test('phòng thủ hai lớp: kể cả khi lỡ cấp quyền UPDATE, trigger vẫn chặn đổi vai trò', async () => {
    await db.exec(`
      grant update on public.profiles to authenticated;
      create policy tmp_update_own on public.profiles for update to authenticated
        using (id = auth.uid()) with check (id = auth.uid());
    `);
    try {
      await expectDenied(() =>
        as(db, user(ids.studentA1), (tx) =>
          rows(tx, `update public.profiles set role = 'admin' where id = $1`, [ids.studentA1])
        )
      );
      // Cột không đặc quyền vẫn sửa được trong kịch bản giả định này → trigger không chặn nhầm
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
  test('phụ huynh đã được duyệt thấy con (chỉ cột tối thiểu)', async () => {
    const r = await as(db, user(ids.parentApproved), (tx) => rows(tx, 'select * from public.get_my_children()'));
    expect(r).toEqual([{ student_id: ids.studentA1, display_name: 'HS A1', grade: 6 }]);
  });

  test.each([
    ['đang chờ duyệt', ids.parentPending, ids.studentA2],
    ['bị từ chối', ids.parentRejected, ids.studentA1],
  ])('phụ huynh %s không đọc được dữ liệu của con', async (_label, parent, child) => {
    const children = await as(db, user(parent), (tx) => rows(tx, 'select * from public.get_my_children()'));
    expect(children).toEqual([]);
    const profile = await as(db, user(parent), (tx) => rows(tx, 'select * from public.profiles where id = $1', [child]));
    expect(profile).toEqual([]);
    const isParent = await as(db, user(parent), (tx) =>
      rows<{ v: boolean }>(tx, 'select public.is_parent_of($1) as v', [child])
    );
    expect(isParent[0].v).toBe(false);
    const classes = await as(db, user(parent), (tx) => rows(tx, 'select * from public.classes'));
    expect(classes).toEqual([]);
  });

  test('phụ huynh thấy trạng thái liên kết của chính mình (để biết đang chờ duyệt)', async () => {
    const r = await as(db, user(ids.parentPending), (tx) =>
      rows<{ status: string }>(tx, 'select status from public.parent_links')
    );
    expect(r).toEqual([{ status: 'pending' }]);
  });
});

// ---------------------------------------------------------------------------
describe('Giáo viên', () => {
  test('xem danh sách học sinh lớp mình với đúng các cột tối thiểu', async () => {
    const r = await as(db, user(ids.teacher1), (tx) => rows(tx, 'select * from public.get_class_roster($1)', [ids.class6A1]));
    expect(r.map((x) => Object.keys(x).sort())[0]).toEqual(['display_name', 'grade', 'student_code', 'user_id']);
    expect(r.map((x) => x.user_id).sort()).toEqual([ids.studentA1, ids.studentA2].sort());
  });

  test('không xem được lớp mình không dạy', async () => {
    const roster = await as(db, user(ids.teacher1), (tx) =>
      rows(tx, 'select * from public.get_class_roster($1)', [ids.class6A2])
    );
    expect(roster).toEqual([]);
    const classes = await as(db, user(ids.teacher1), (tx) => rows<{ id: string }>(tx, 'select id from public.classes'));
    expect(classes.map((x) => x.id)).toEqual([ids.class6A1]);
  });

  test('không đọc được toàn bộ hàng hồ sơ học sinh (chỉ qua danh sách lớp)', async () => {
    const r = await as(db, user(ids.teacher1), (tx) => rows<{ id: string }>(tx, 'select id from public.profiles'));
    expect(r.map((x) => x.id)).toEqual([ids.teacher1]);
  });

  test('teaches_student đúng phạm vi lớp', async () => {
    const r = await as(db, user(ids.teacher1), (tx) =>
      rows<{ a: boolean; b: boolean }>(tx, 'select public.teaches_student($1) a, public.teaches_student($2) b', [
        ids.studentA1,
        ids.studentA3,
      ])
    );
    expect(r[0]).toEqual({ a: true, b: false });
  });
});

// ---------------------------------------------------------------------------
describe('Quản trị nhà trường và admin', () => {
  test('quản trị trường A thấy hồ sơ trường A, không thấy trường B', async () => {
    const r = await as(db, user(ids.schoolAdminA), (tx) =>
      rows<{ school_id: string }>(tx, 'select distinct school_id from public.profiles')
    );
    expect(r.map((x) => x.school_id)).toEqual([ids.schoolA]);
    const b = await as(db, user(ids.schoolAdminA), (tx) =>
      rows(tx, 'select * from public.get_class_roster($1)', [ids.classB])
    );
    expect(b).toEqual([]);
  });

  test('admin hệ thống thấy mọi trường', async () => {
    const r = await as(db, user(ids.admin), (tx) => rows(tx, 'select id from public.schools'));
    expect(r).toHaveLength(2);
  });

  test('tài khoản chưa có vai trò chỉ thấy hồ sơ của mình', async () => {
    const r = await as(db, user(ids.noRole), (tx) => rows<{ id: string }>(tx, 'select id from public.profiles'));
    expect(r.map((x) => x.id)).toEqual([ids.noRole]);
    const c = await as(db, user(ids.noRole), (tx) => rows(tx, 'select * from public.classes'));
    expect(c).toEqual([]);
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
      const status = await rows<{ v: string | null }>(tx, 'select public.login_lock_status($1) v', [key]);
      expect(status[0].v).not.toBeNull();
      await tx.query('select public.login_clear($1)', [key]);
      const cleared = await rows<{ v: string | null }>(tx, 'select public.login_lock_status($1) v', [key]);
      expect(cleared[0].v).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
describe('Quy tắc chung cho mọi bảng/hàm (bắt lỗi khi thêm bảng mới)', () => {
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

  test('authenticated chỉ có quyền SELECT (ghi đi qua server)', async () => {
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
    expect(r.rows.length).toBeGreaterThan(5);
  });
});
