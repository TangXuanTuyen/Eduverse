import { getCurrentProfile } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { completeExperiment } from '@/services/lab-assignments';

export async function POST(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({}, { status: 403 });

  const body = await req.json();
  const { submissionId } = body;
  if (!submissionId) return NextResponse.json({ error: 'Missing submissionId' }, { status: 400 });

  try {
    await completeExperiment(profile.id, submissionId);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Lỗi' },
      { status: 400 }
    );
  }
}
