import { getCurrentProfile } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { getPublishedLessons } from '@/services/lessons';

export async function GET(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json([], { status: 401 });

  const url = new URL(req.url);
  const subject = url.searchParams.get('subject') ?? undefined;
  const grade = url.searchParams.get('grade') ? Number(url.searchParams.get('grade')) : undefined;

  try {
    const lessons = await getPublishedLessons({ subject, grade_level: grade });
    return NextResponse.json(lessons);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
