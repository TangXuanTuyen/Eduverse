/**
 * Seed dữ liệu giả cho môi trường DEV (Supabase Cloud project dành riêng cho dev).
 *   npm run seed            — tạo dữ liệu nếu chưa có (chạy lại an toàn)
 *   npm run seed -- --reset-passwords  — đặt lại mật khẩu tạm cho mọi tài khoản seed
 *
 * Mật khẩu sinh ngẫu nhiên, ghi vào .seed-credentials.local.md (đã gitignore), không in ra màn hình.
 * Toàn bộ người là giả. Không dùng cho môi trường thật.
 */
import { writeFileSync } from 'node:fs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  createStaffOrParentAccount,
  createStudentAccount,
  generateTempPassword,
} from '../services/accounts-core';
import { studentEmailFromCode } from '../lib/auth/identifier';

process.loadEnvFile?.('.env.local');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local');
  process.exit(1);
}
const resetPasswords = process.argv.includes('--reset-passwords');

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const SCHOOL = { name: 'Trường THCS EDUVERSE (thử nghiệm)', code: 'EDU' };
const SCHOOL_YEAR = '2026-2027';

const STAFF = [
  { key: 'qtv', email: 'qtv.eduverse@example.com', role: 'school_admin', name: 'Quản trị Nhà trường (giả)' },
  { key: 'gv1', email: 'gv.lan.eduverse@example.com', role: 'teacher', name: 'Cô Nguyễn Thị Lan (giả)' },
  { key: 'gv2', email: 'gv.minh.eduverse@example.com', role: 'teacher', name: 'Thầy Trần Văn Minh (giả)' },
  { key: 'ph1', email: 'ph.hoa.eduverse@example.com', role: 'parent', name: 'Phụ huynh Lê Thị Hoa (giả)' },
  { key: 'ph2', email: 'ph.tuan.eduverse@example.com', role: 'parent', name: 'Phụ huynh Phạm Văn Tuấn (giả)' },
] as const;

// Tên học sinh giả, không phải người thật
const STUDENT_NAMES = [
  'Nguyễn Minh An', 'Trần Gia Bảo', 'Lê Ngọc Chi', 'Phạm Đức Dũng', 'Hoàng Thu Hà',
  'Vũ Quang Huy', 'Đặng Bảo Khánh', 'Bùi Thanh Lam', 'Đỗ Hải Nam', 'Ngô Phương Thảo',
];
const STUDENTS = STUDENT_NAMES.map((name, i) => ({
  code: `EDU6A1${String(i + 1).padStart(2, '0')}`,
  name: `${name} (giả)`,
}));

type Cred = { who: string; login: string; password: string; note: string };

async function listUsersByEmail(client: SupabaseClient) {
  const map = new Map<string, string>();
  for (let page = 1; ; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    data.users.forEach((u) => u.email && map.set(u.email.toLowerCase(), u.id));
    if (data.users.length < 1000) break;
  }
  return map;
}

async function main() {
  const creds: Cred[] = [];
  const existing = await listUsersByEmail(admin);

  // Trường
  let { data: school } = await admin.from('schools').select('id').eq('code', SCHOOL.code).maybeSingle();
  if (!school) {
    const { data, error } = await admin.from('schools').insert(SCHOOL).select('id').single();
    if (error) throw error;
    school = data;
  }
  const schoolId = school.id as string;

  // Quản trị, giáo viên, phụ huynh
  const ids: Record<string, string> = {};
  for (const s of STAFF) {
    const found = existing.get(s.email);
    const password = generateTempPassword(14);
    if (found) {
      ids[s.key] = found;
      if (resetPasswords) {
        await admin.auth.admin.updateUserById(found, { password });
        creds.push({ who: s.name, login: s.email, password, note: s.role });
      }
      continue;
    }
    const { userId } = await createStaffOrParentAccount(admin, {
      email: s.email,
      role: s.role,
      schoolId,
      displayName: s.name,
      password,
    });
    ids[s.key] = userId;
    creds.push({ who: s.name, login: s.email, password, note: s.role });
  }

  // Học sinh (mật khẩu tạm, bắt đổi lần đầu)
  const studentIds: string[] = [];
  for (const st of STUDENTS) {
    const email = studentEmailFromCode(st.code);
    const found = existing.get(email);
    const temp = generateTempPassword();
    if (found) {
      studentIds.push(found);
      if (resetPasswords) {
        await admin.auth.admin.updateUserById(found, { password: temp });
        await admin.from('profiles').update({ must_change_password: true }).eq('id', found);
        creds.push({ who: st.name, login: st.code, password: temp, note: 'học sinh, phải đổi mật khẩu' });
      }
      continue;
    }
    const { userId } = await createStudentAccount(admin, {
      schoolId,
      studentCode: st.code,
      displayName: st.name,
      grade: 6,
      tempPassword: temp,
    });
    studentIds.push(userId);
    creds.push({ who: st.name, login: st.code, password: temp, note: 'học sinh, phải đổi mật khẩu' });
  }

  // Lớp 6A1 (cô Lan chủ nhiệm, 10 học sinh). Thầy Minh chưa có lớp.
  let { data: klass } = await admin
    .from('classes')
    .select('id')
    .eq('school_id', schoolId)
    .eq('school_year', SCHOOL_YEAR)
    .eq('name', '6A1')
    .maybeSingle();
  if (!klass) {
    const { data, error } = await admin
      .from('classes')
      .insert({ school_id: schoolId, name: '6A1', grade: 6, school_year: SCHOOL_YEAR })
      .select('id')
      .single();
    if (error) throw error;
    klass = data;
  }
  const members = [
    { class_id: klass.id, user_id: ids.gv1, member_role: 'teacher' },
    ...studentIds.map((id) => ({ class_id: klass!.id, user_id: id, member_role: 'student' })),
  ];
  const { error: memberError } = await admin.from('class_members').upsert(members, { onConflict: 'class_id,user_id' });
  if (memberError) throw memberError;

  // Phụ huynh: PH Hoa đã duyệt với HS 01, PH Tuấn đang chờ duyệt với HS 02
  const { error: linkError } = await admin.from('parent_links').upsert(
    [
      { parent_id: ids.ph1, student_id: studentIds[0], status: 'approved', decided_by: ids.qtv, decided_at: new Date().toISOString() },
      { parent_id: ids.ph2, student_id: studentIds[1], status: 'pending' },
    ],
    { onConflict: 'parent_id,student_id' }
  );
  if (linkError) throw linkError;

  if (creds.length > 0) {
    const lines = [
      '# Tài khoản seed (DEV) — KHÔNG commit, KHÔNG dùng cho môi trường thật',
      '',
      `Tạo lúc: ${new Date().toISOString()}`,
      '',
      '| Người (giả) | Đăng nhập | Mật khẩu | Ghi chú |',
      '|---|---|---|---|',
      ...creds.map((c) => `| ${c.who} | ${c.login} | ${c.password} | ${c.note} |`),
      '',
    ];
    writeFileSync('.seed-credentials.local.md', lines.join('\n'), { mode: 0o600 });
    console.log(`Đã tạo/cập nhật ${creds.length} tài khoản. Mật khẩu ghi trong .seed-credentials.local.md`);
  } else {
    console.log('Dữ liệu seed đã có sẵn, không tạo thêm. Dùng --reset-passwords để cấp lại mật khẩu.');
  }
}

main().catch((e) => {
  console.error('Seed thất bại:', e instanceof Error ? e.message : e);
  process.exit(1);
});
