import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { getStudentAssignments } from '@/services/assignments';

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const assignments = await getStudentAssignments(profile.id);
    return NextResponse.json({ assignments });
  } catch {
    return NextResponse.json({ assignments: [] });
  }
}
