/**
 * Seed dữ liệu giả cho môi trường DEV (Supabase Cloud project dành riêng cho dev).
 *   npm run seed            — tạo dữ liệu nếu chưa có
 *   npm run seed -- --force — xóa dữ liệu cũ và tạo lại
 *
 * Toàn bộ người là giả. Không dùng cho môi trường thật.
 */
import { writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

process.loadEnvFile?.('.env.local');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local');
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const USERS = [
  { key: 'gv1', email: 'gv.lan.eduverse@example.com', role: 'teacher' as const, name: 'Cô Nguyễn Thị Lan (giả)' },
  { key: 'gv2', email: 'gv.minh.eduverse@example.com', role: 'teacher' as const, name: 'Thầy Trần Văn Minh (giả)' },
  { key: 'ph1', email: 'ph.hoa.eduverse@example.com', role: 'parent' as const, name: 'Phụ huynh Lê Thị Hoa (giả)' },
  { key: 'ph2', email: 'ph.tuan.eduverse@example.com', role: 'parent' as const, name: 'Phụ huynh Phạm Văn Tuấn (giả)' },
  ...Array.from({ length: 10 }, (_, i) => ({
    key: `hs${i + 1}`,
    email: `hs${i + 1}.eduverse@example.com`,
    role: 'student' as const,
    name: [
      'Nguyễn Minh An', 'Trần Gia Bảo', 'Lê Ngọc Chi', 'Phạm Đức Dũng', 'Hoàng Thu Hà',
      'Vũ Quang Huy', 'Đặng Bảo Khánh', 'Bùi Thanh Lam', 'Đỗ Hải Nam', 'Ngô Phương Thảo',
    ][i] + ' (giả)',
  })),
];

async function ensureUser(email: string, name: string, role: string) {
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list?.users.find((u) => u.email === email);
  if (existing) return existing.id;

  const password = 'SeedPass' + Math.random().toString(36).slice(2, 10);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (error) throw error;

  await admin.from('profiles').update({ role, display_name: name, grade: role === 'student' ? 6 : null }).eq('id', data.user.id);
  return data.user.id;
}

async function main() {
  const ids: Record<string, string> = {};
  for (const u of USERS) {
    ids[u.key] = await ensureUser(u.email, u.name, u.role);
    console.log(`  ${u.role.padEnd(8)} ${u.name}`);
  }

  // Phòng KHTN 6A1 (cô Lan)
  let { data: room } = await admin
    .from('rooms')
    .select('id, join_code')
    .eq('owner_id', ids.gv1)
    .eq('name', 'KHTN 6A1')
    .maybeSingle();

  if (!room) {
    const { data: code } = await admin.rpc('generate_join_code');
    const { data, error } = await admin
      .from('rooms')
      .insert({
        name: 'KHTN 6A1',
        subject: 'KHTN',
        grade: 6,
        owner_id: ids.gv1,
        join_code: code,
        join_code_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id, join_code')
      .single();
    if (error) throw error;
    room = data;
    console.log(`  Phòng "KHTN 6A1" tạo xong, mã: ${room!.join_code}`);
  }

  // Thêm cô Lan + 10 học sinh vào phòng
  const members = [
    { room_id: room!.id, user_id: ids.gv1 },
    ...Array.from({ length: 10 }, (_, i) => ({ room_id: room!.id, user_id: ids[`hs${i + 1}`] })),
  ];
  await admin.from('room_members').upsert(members, { onConflict: 'room_id,user_id' });

  // Phụ huynh links
  await admin.from('parent_links').upsert(
    [
      { parent_id: ids.ph1, student_id: ids.hs1, status: 'approved', decided_by: ids.gv1, decided_at: new Date().toISOString() },
      { parent_id: ids.ph2, student_id: ids.hs2, status: 'pending' },
    ],
    { onConflict: 'parent_id,student_id' }
  );

  const lines = [
    '# Tài khoản seed (DEV)',
    '',
    `Tạo lúc: ${new Date().toISOString()}`,
    '',
    `Phòng "KHTN 6A1" — mã vào: ${room!.join_code}`,
    '',
    'Đăng nhập bằng Google với các email trên (hoặc tạo user mới qua Supabase Dashboard).',
    '',
  ];
  writeFileSync('.seed-credentials.local.md', lines.join('\n'), { mode: 0o600 });
  console.log('\nSeed xong! Xem .seed-credentials.local.md');
}

main().catch((e) => {
  console.error('Seed thất bại:', e instanceof Error ? e.message : e);
  process.exit(1);
});
