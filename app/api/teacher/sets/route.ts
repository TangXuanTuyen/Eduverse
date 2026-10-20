import { getCurrentProfile } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { getTeacherSets } from '@/services/question-sets';

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') {
    return NextResponse.json({ sets: [] }, { status: 403 });
  }

  try {
    const sets = await getTeacherSets(profile.id);
    return NextResponse.json({ sets });
  } catch {
    return NextResponse.json({ sets: [] }, { status: 500 });
  }
}
