import { getCurrentProfile } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { getLessonDetail, getOrCreateProgress, getObservationNotes, getLessonRecommendation } from '@/services/lessons';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({}, { status: 401 });

  const { id } = await params;

  try {
    const lesson = await getLessonDetail(id);
    if (lesson.status !== 'published') {
      return NextResponse.json({ error: 'Bài học chưa xuất bản' }, { status: 403 });
    }

    const progress = await getOrCreateProgress(profile.id, id);
    const notes = await getObservationNotes(profile.id, id);
    const recommendation = await getLessonRecommendation(profile.id, id);

    const notesMap: Record<number, { prediction: string; observation: string; explanation: string }> = {};
    for (const n of notes) {
      const note = n as { step_index: number; prediction: string; observation: string; explanation: string };
      notesMap[note.step_index] = {
        prediction: note.prediction,
        observation: note.observation,
        explanation: note.explanation,
      };
    }

    return NextResponse.json({
      lesson: {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        subject: lesson.subject,
        grade_level: lesson.grade_level,
        content: lesson.content,
      },
      progress: {
        currentStep: progress.current_step,
        completedSteps: progress.completed_steps,
        isCompleted: progress.is_completed,
      },
      notes: notesMap,
      recommendation,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Lỗi' }, { status: 500 });
  }
}
