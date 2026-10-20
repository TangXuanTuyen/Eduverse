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
  // Bước 3: câu hỏi, bài giao
  question1: '00000000-0000-4000-d000-000000000001', // single_choice
  question2: '00000000-0000-4000-d000-000000000002', // essay
  question3: '00000000-0000-4000-d000-000000000003', // teacher2's question
  assignment1: '00000000-0000-4000-d000-000000000011', // room1
  assignment2: '00000000-0000-4000-d000-000000000012', // room2
  aq1: '00000000-0000-4000-d000-000000000021', // assignment_question for q1
  aq2: '00000000-0000-4000-d000-000000000022', // assignment_question for q2
  submission1: '00000000-0000-4000-d000-000000000031', // studentA1 draft
  attempt1: '00000000-0000-4000-d000-000000000041', // question_attempt
  // Bước 7: reports
  auditLog1: '00000000-0000-4000-e000-000000000001',
  weeklySummary1: '00000000-0000-4000-e000-000000000011',
  // Bước 8: phòng chung
  roomSession1: '00000000-0000-4000-f000-000000000001',
  roomSessionParticipant1: '00000000-0000-4000-f000-000000000011',
  socialSettings1: '00000000-0000-4000-f000-000000000021',
  studentReport1: '00000000-0000-4000-f000-000000000031',
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

  // --- Bước 3: Câu hỏi, bài giao ---

  // Câu hỏi teacher1: trắc nghiệm + tự luận
  await db.query(
    `insert into public.questions (id, owner_id, type, content, options, skill_tags, difficulty)
     values ($1, $2, 'single_choice', 'Đơn vị đo lực là gì?',
       '[{"id":"a","text":"Newton"},{"id":"b","text":"Joule"},{"id":"c","text":"Watt"}]',
       '{luc,co-hoc}', 1)`,
    [ids.question1, ids.teacher1]
  );
  await db.query(
    `insert into public.question_answers (question_id, correct_answer) values ($1, '"a"')`,
    [ids.question1]
  );

  await db.query(
    `insert into public.questions (id, owner_id, type, content, difficulty)
     values ($1, $2, 'essay', 'Giải thích tại sao lá cây có màu xanh.', 2)`,
    [ids.question2, ids.teacher1]
  );
  await db.query(
    `insert into public.question_answers (question_id, correct_answer) values ($1, null)`,
    [ids.question2]
  );

  // Câu hỏi teacher2
  await db.query(
    `insert into public.questions (id, owner_id, type, content, options, difficulty)
     values ($1, $2, 'single_choice', 'H2O là công thức của gì?',
       '[{"id":"a","text":"Nước"},{"id":"b","text":"Muối"}]', 1)`,
    [ids.question3, ids.teacher2]
  );
  await db.query(
    `insert into public.question_answers (question_id, correct_answer) values ($1, '"a"')`,
    [ids.question3]
  );

  // Assignment trong room1 (teacher1)
  await db.query(
    `insert into public.assignments (id, room_id, title, created_by, due_at)
     values ($1, $2, 'Kiểm tra Cơ học', $3, now() + interval '7 days')`,
    [ids.assignment1, ids.room1, ids.teacher1]
  );

  // Assignment trong room2 (teacher2)
  await db.query(
    `insert into public.assignments (id, room_id, title, created_by)
     values ($1, $2, 'Kiểm tra Hóa học', $3)`,
    [ids.assignment2, ids.room2, ids.teacher2]
  );

  // Snapshot câu hỏi vào bài giao 1
  await db.query(
    `insert into public.assignment_questions (id, assignment_id, source_question_id, sort_order, type, content, options, correct_answer, explanation, points)
     values ($1, $2, $3, 0, 'single_choice', 'Đơn vị đo lực là gì?',
       '[{"id":"a","text":"Newton"},{"id":"b","text":"Joule"},{"id":"c","text":"Watt"}]',
       '"a"', '', 2)`,
    [ids.aq1, ids.assignment1, ids.question1]
  );
  await db.query(
    `insert into public.assignment_questions (id, assignment_id, source_question_id, sort_order, type, content, correct_answer, explanation, points)
     values ($1, $2, $3, 1, 'essay', 'Giải thích tại sao lá cây có màu xanh.', null, '', 3)`,
    [ids.aq2, ids.assignment1, ids.question2]
  );

  // Submission nháp của studentA1
  await db.query(
    `insert into public.submissions (id, assignment_id, student_id, status)
     values ($1, $2, $3, 'draft')`,
    [ids.submission1, ids.assignment1, ids.studentA1]
  );

  // Một câu trả lời nháp
  await db.query(
    `insert into public.question_attempts (id, submission_id, assignment_question_id, student_answer)
     values ($1, $2, $3, '"a"')`,
    [ids.attempt1, ids.submission1, ids.aq1]
  );

  // --- Bước 7: Reports ---

  // Audit log từ teacher1
  await db.query(
    `insert into public.audit_logs (id, actor_id, action, target_type, target_id, metadata)
     values ($1, $2, 'view_student_report', 'student', $3, '{}')`,
    [ids.auditLog1, ids.teacher1, ids.studentA1]
  );

  // Weekly summary cho studentA1 (phụ huynh đã duyệt xem được)
  await db.query(
    `insert into public.weekly_summaries (id, student_id, week_start, summary_text, stats)
     values ($1, $2, '2026-10-19', 'Tuần này em học tốt.', '{"xp_earned": 100}')`,
    [ids.weeklySummary1, ids.studentA1]
  );

  // --- Bước 8: Phòng chung ---

  // Room session trong room1
  await db.query(
    `insert into public.room_sessions (id, room_id, created_by, type, title)
     values ($1, $2, $3, 'coop_boss', 'Boss Cơ học')`,
    [ids.roomSession1, ids.room1, ids.teacher1]
  );

  // Participant: studentA1
  await db.query(
    `insert into public.room_session_participants (id, session_id, user_id)
     values ($1, $2, $3)`,
    [ids.roomSessionParticipant1, ids.roomSession1, ids.studentA1]
  );

  // Social settings cho room1
  await db.query(
    `insert into public.social_settings (id, room_id, updated_by)
     values ($1, $2, $3)`,
    [ids.socialSettings1, ids.room1, ids.teacher1]
  );

  // Báo cáo từ studentA1 về studentA2
  await db.query(
    `insert into public.student_reports (id, room_id, reporter_id, reported_id, reason)
     values ($1, $2, $3, $4, 'Spam biểu cảm')`,
    [ids.studentReport1, ids.room1, ids.studentA1, ids.studentA2]
  );
}
