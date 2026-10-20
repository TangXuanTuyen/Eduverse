import { getCurrentProfile } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { getExperimentDetail } from '@/services/experiments';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({}, { status: 403 });

  const { id } = await params;

  try {
    const detail = await getExperimentDetail(id);
    return NextResponse.json(detail);
  } catch {
    return NextResponse.json({}, { status: 404 });
  }
}
