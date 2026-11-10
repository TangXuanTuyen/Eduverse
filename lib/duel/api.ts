import 'server-only';
import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';

/** Chỉ học sinh đã đăng nhập; trả về profile hoặc phản hồi lỗi. */
export async function requireStudent() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'student') {
    return { error: NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 }) } as const;
  }
  return { profile } as const;
}

export function fail(e: unknown, status = 400) {
  return NextResponse.json({ error: e instanceof Error ? e.message : 'Lỗi' }, { status });
}
