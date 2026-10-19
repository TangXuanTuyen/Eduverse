import type { PGlite } from '@electric-sql/pglite';

/**
 * Dữ liệu kiểm thử: 2 trường, 2 lớp ở trường A, 1 lớp ở trường B,
 * học sinh, giáo viên, phụ huynh (đã duyệt / đang chờ / bị từ chối), tài khoản chưa có vai trò.
 * Chèn bằng quyền superuser (giống server dùng service_role).
 */
export const ids = {
  schoolA: '00000000-0000-4000-a000-00000000000a',
  schoolB: '00000000-0000-4000-a000-00000000000b',
  class6A1: '00000000-0000-4000-c000-000000000001',
  class6A2: '00000000-0000-4000-c000-000000000002',
  classB: '00000000-0000-4000-c000-00000000000b',
  admin: '00000000-0000-4000-8000-000000000001',
  schoolAdminA: '00000000-0000-4000-8000-000000000002',
  schoolAdminB: '00000000-0000-4000-8000-000000000003',
  teacher1: '00000000-0000-4000-8000-000000000011',
  teacher2: '00000000-0000-4000-8000-000000000012',
  studentA1: '00000000-0000-4000-8000-000000000021',
  studentA2: '00000000-0000-4000-8000-000000000022',
  studentA3: '00000000-0000-4000-8000-000000000023', // lớp 6A2
  studentB1: '00000000-0000-4000-8000-000000000031', // trường B
  parentApproved: '00000000-0000-4000-8000-000000000041',
  parentPending: '00000000-0000-4000-8000-000000000042',
  parentRejected: '00000000-0000-4000-8000-000000000043',
  noRole: '00000000-0000-4000-8000-000000000051',
} as const;

type ProfileSeed = {
  id: string;
  role: string | null;
  school: string | null;
  name: string;
  code?: string;
  grade?: number;
};

const profiles: ProfileSeed[] = [
  { id: ids.admin, role: 'admin', school: null, name: 'Admin hệ thống' },
  { id: ids.schoolAdminA, role: 'school_admin', school: ids.schoolA, name: 'QTV trường A' },
  { id: ids.schoolAdminB, role: 'school_admin', school: ids.schoolB, name: 'QTV trường B' },
  { id: ids.teacher1, role: 'teacher', school: ids.schoolA, name: 'GV 1' },
  { id: ids.teacher2, role: 'teacher', school: ids.schoolA, name: 'GV 2' },
  { id: ids.studentA1, role: 'student', school: ids.schoolA, name: 'HS A1', code: 'TSTA0001', grade: 6 },
  { id: ids.studentA2, role: 'student', school: ids.schoolA, name: 'HS A2', code: 'TSTA0002', grade: 6 },
  { id: ids.studentA3, role: 'student', school: ids.schoolA, name: 'HS A3', code: 'TSTA0003', grade: 6 },
  { id: ids.studentB1, role: 'student', school: ids.schoolB, name: 'HS B1', code: 'TSTB0001', grade: 6 },
  { id: ids.parentApproved, role: 'parent', school: ids.schoolA, name: 'PH duyệt' },
  { id: ids.parentPending, role: 'parent', school: ids.schoolA, name: 'PH chờ' },
  { id: ids.parentRejected, role: 'parent', school: ids.schoolA, name: 'PH từ chối' },
  { id: ids.noRole, role: null, school: null, name: '' },
];

export async function seedFixtures(db: PGlite) {
  await db.query(`insert into public.schools (id, name, code) values ($1, 'Trường A', 'TSTA'), ($2, 'Trường B', 'TSTB')`, [
    ids.schoolA,
    ids.schoolB,
  ]);

  for (const p of profiles) {
    // Cố tình đặt metadata "role: admin" để chứng minh trigger không đọc metadata
    await db.query(
      `insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
       values ($1, $2, '{"role":"admin"}', '{"role":"admin"}')`,
      [p.id, `${p.id}@test.local`]
    );
    if (p.role) {
      await db.query(
        `update public.profiles
           set role = $2::public.app_role, school_id = $3, display_name = $4, student_code = $5, grade = $6
         where id = $1`,
        [p.id, p.role, p.school, p.name, p.code ?? null, p.grade ?? null]
      );
    }
  }

  await db.query(
    `insert into public.classes (id, school_id, name, grade, school_year) values
       ($1, $4, '6A1', 6, '2026-2027'),
       ($2, $4, '6A2', 6, '2026-2027'),
       ($3, $5, '6B1', 6, '2026-2027')`,
    [ids.class6A1, ids.class6A2, ids.classB, ids.schoolA, ids.schoolB]
  );

  const members: [string, string, string][] = [
    [ids.class6A1, ids.teacher1, 'teacher'],
    [ids.class6A1, ids.studentA1, 'student'],
    [ids.class6A1, ids.studentA2, 'student'],
    [ids.class6A2, ids.teacher2, 'teacher'],
    [ids.class6A2, ids.studentA3, 'student'],
    [ids.classB, ids.studentB1, 'student'],
  ];
  for (const [c, u, r] of members) {
    await db.query(
      `insert into public.class_members (class_id, user_id, member_role) values ($1, $2, $3::public.class_member_role)`,
      [c, u, r]
    );
  }

  await db.query(
    `insert into public.parent_links (parent_id, student_id, status) values
       ($1, $4, 'approved'), ($2, $5, 'pending'), ($3, $4, 'rejected')`,
    [ids.parentApproved, ids.parentPending, ids.parentRejected, ids.studentA1, ids.studentA2]
  );
}
