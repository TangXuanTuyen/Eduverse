import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/session';
import { getOrCreateDraft, saveDraft, submitAssignment } from '@/services/submissions';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: assignmentId } = await params;
  const body = await req.json();
  const answers: Record<string, unknown> = body.answers;

  if (!answers || typeof answers !== 'object') {
    return NextResponse.json({ error: 'Thiếu câu trả lời' }, { status: 400 });
  }

  try {
    const draft = await getOrCreateDraft(assignmentId, profile.id);
    await saveDraft(draft.id, profile.id, answers);
    const result = await submitAssignment(draft.id, profile.id);

    return NextResponse.json({
      status: result.status,
      totalScore: result.totalScore,
      maxScore: result.maxScore,
      isLate: result.isLate,
      xpAwarded: result.xpAwarded,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi nộp bài';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
