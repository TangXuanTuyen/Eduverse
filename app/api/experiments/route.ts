import { getCurrentProfile } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { getAllPublishedExperiments } from '@/services/experiments';

export async function GET(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json([], { status: 403 });

  const url = new URL(req.url);
  const subject = url.searchParams.get('subject') ?? undefined;
  const grade = url.searchParams.get('grade') ? Number(url.searchParams.get('grade')) : undefined;

  try {
    const experiments = await getAllPublishedExperiments({
      subject,
      grade_level: grade,
    });
    return NextResponse.json(experiments);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
