import { getCurrentProfile } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { getAllPublishedModels } from '@/services/models-3d';

export async function GET(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json([], { status: 403 });

  const url = new URL(req.url);
  const subject = url.searchParams.get('subject') ?? undefined;
  const grade = url.searchParams.get('grade') ? Number(url.searchParams.get('grade')) : undefined;

  try {
    const models = await getAllPublishedModels({ subject, grade_level: grade });
    return NextResponse.json(models);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
