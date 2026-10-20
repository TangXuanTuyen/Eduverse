import { getCurrentProfile } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { getStudentGameAssignments } from '@/services/game-assignments';

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json([], { status: 401 });

  try {
    const assignments = await getStudentGameAssignments(profile.id);
    return NextResponse.json(assignments);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
