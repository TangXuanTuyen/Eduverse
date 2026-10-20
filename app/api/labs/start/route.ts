import { getCurrentProfile } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { startExperiment } from '@/services/lab-assignments';

export async function POST(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({}, { status: 403 });

  const body = await req.json();
  const { experimentId, labAssignmentId } = body;
  if (!experimentId) return NextResponse.json({ error: 'Missing experimentId' }, { status: 400 });

  try {
    const result = await startExperiment(profile.id, experimentId, labAssignmentId);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Lỗi' },
      { status: 400 }
    );
  }
}
