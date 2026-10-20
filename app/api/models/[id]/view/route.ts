import { getCurrentProfile } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { recordModelView } from '@/services/models-3d';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({}, { status: 403 });

  const { id } = await params;

  try {
    await recordModelView(profile.id, id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({}, { status: 500 });
  }
}
