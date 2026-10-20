import type { PGlite } from '@electric-sql/pglite';

/**
 * Dữ liệu kiểm thử: 2 phòng, giáo viên, học sinh, phụ huynh, tài khoản chưa có vai trò.
 * Chèn bằng quyền superuser (giống server dùng service_role).
 */
export const ids = {
  room1: '00000000-0000-4000-c000-000000000001',
  room2: '00000000-0000-4000-c000-000000000002',
  teacher1: '00000000-0000-4000-8000-000000000011',
  teacher2: '00000000-0000-4000-8000-000000000012',
  studentA1: '00000000-0000-4000-8000-000000000021',
  studentA2: '00000000-0000-4000-8000-000000000022',
  studentB1: '00000000-0000-4000-8000-000000000031',
  parentApproved: '00000000-0000-4000-8000-000000000041',
  parentPending: '00000000-0000-4000-8000-000000000042',
  noRole: '00000000-0000-4000-8000-000000000051',
} as const;

type ProfileSeed = {
  id: string;
  role: string | null;
  name: string;
  grade?: number;
};

const profiles: ProfileSeed[] = [
  { id: ids.teacher1, role: 'teacher', name: 'GV 1' },
  { id: ids.teacher2, role: 'teacher', name: 'GV 2' },
  { id: ids.studentA1, role: 'student', name: 'HS A1', grade: 6 },
  { id: ids.studentA2, role: 'student', name: 'HS A2', grade: 6 },
  { id: ids.studentB1, role: 'student', name: 'HS B1', grade: 6 },
  { id: ids.parentApproved, role: 'parent', name: 'PH duyệt' },
  { id: ids.parentPending, role: 'parent', name: 'PH chờ' },
  { id: ids.noRole, role: null, name: '' },
];

export async function seedFixtures(db: PGlite) {
  for (const p of profiles) {
    await db.query(
      `insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
       values ($1, $2, '{"role":"admin"}', '{"role":"admin"}')`,
      [p.id, `${p.id}@test.local`]
    );
    if (p.role) {
      await db.query(
        `update public.profiles
           set role = $2::public.app_role, display_name = $3, grade = $4
         where id = $1`,
        [p.id, p.role, p.name, p.grade ?? null]
      );
    }
  }

  // Phòng 1: teacher1 sở hữu, gồm studentA1 + studentA2
  await db.query(
    `insert into public.rooms (id, name, grade, join_code, owner_id) values ($1, 'KHTN 6A1', 6, 'ABCDEF', $2)`,
    [ids.room1, ids.teacher1]
  );
  const room1Members: [string, string][] = [
    [ids.room1, ids.teacher1],
    [ids.room1, ids.studentA1],
    [ids.room1, ids.studentA2],
  ];
  for (const [r, u] of room1Members) {
    await db.query(`insert into public.room_members (room_id, user_id) values ($1, $2)`, [r, u]);
  }

  // Phòng 2: teacher2 sở hữu, gồm studentB1
  await db.query(
    `insert into public.rooms (id, name, grade, join_code, owner_id) values ($1, 'KHTN 6B1', 6, 'GHJKLM', $2)`,
    [ids.room2, ids.teacher2]
  );
  await db.query(`insert into public.room_members (room_id, user_id) values ($1, $2)`, [ids.room2, ids.teacher2]);
  await db.query(`insert into public.room_members (room_id, user_id) values ($1, $2)`, [ids.room2, ids.studentB1]);

  // Parent links
  await db.query(
    `insert into public.parent_links (parent_id, student_id, status) values ($1, $2, 'approved'), ($3, $4, 'pending')`,
    [ids.parentApproved, ids.studentA1, ids.parentPending, ids.studentA2]
  );
}
