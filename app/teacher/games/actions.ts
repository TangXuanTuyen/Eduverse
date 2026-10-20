'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/auth/session';
import { createGame, deleteGame } from '@/services/games';
import { startSession, advanceQuestion, endSession, submitAnswer, joinSession } from '@/services/game-sessions';
import { assignGame } from '@/services/game-assignments';

export type GameActionState = { error?: string; success?: string; gameId?: string };

export async function createGameAction(
  _prev: GameActionState,
  formData: FormData
): Promise<GameActionState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') return { error: 'Không có quyền' };

  const name = (formData.get('name') as string)?.trim();
  const questionSetId = formData.get('question_set_id') as string;
  const mode = (formData.get('mode') as string) || 'thi_dau';
  const timePerQuestion = Number(formData.get('time_per_question')) || 30;
  const pointsPerQuestion = Number(formData.get('points_per_question')) || 100;
  const shuffleQuestions = formData.get('shuffle_questions') === 'true';
  const shuffleOptions = formData.get('shuffle_options') === 'true';
  const levelProgression = formData.get('level_progression') === 'true';

  if (!name) return { error: 'Nhập tên trò chơi' };
  if (!questionSetId) return { error: 'Chọn bộ đề' };

  try {
    const gameId = await createGame(profile.id, {
      name,
      question_set_id: questionSetId,
      mode: mode as 'tu_luyen' | 'thi_dau',
      time_per_question: Math.min(120, Math.max(5, timePerQuestion)),
      points_per_question: Math.min(1000, Math.max(1, pointsPerQuestion)),
      shuffle_questions: shuffleQuestions,
      shuffle_options: shuffleOptions,
      level_progression: levelProgression,
    });
    revalidatePath('/teacher/games');
    return { success: 'Đã tạo trò chơi!', gameId };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi tạo trò chơi' };
  }
}

export async function deleteGameAction(gameId: string): Promise<{ error?: string }> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') return { error: 'Không có quyền' };

  try {
    await deleteGame(gameId, profile.id);
    revalidatePath('/teacher/games');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi xóa' };
  }
}

export async function startSessionAction(gameId: string, roomId?: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') return { error: 'Không có quyền' };

  try {
    const session = await startSession(gameId, profile.id, roomId);
    return { sessionId: session.id, joinCode: session.join_code };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi bắt đầu phiên' };
  }
}

export async function advanceQuestionAction(sessionId: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') return { error: 'Không có quyền' };

  try {
    return await advanceQuestion(sessionId, profile.id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi' };
  }
}

export async function endSessionAction(sessionId: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') return { error: 'Không có quyền' };

  try {
    await endSession(sessionId, profile.id);
    revalidatePath('/teacher/games');
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi' };
  }
}

export async function joinSessionAction(joinCode: string) {
  const profile = await getCurrentProfile();
  if (!profile) return { error: 'Chưa đăng nhập' };

  try {
    const result = await joinSession(joinCode, profile.id, profile.displayName || 'Học sinh');
    return result;
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi tham gia' };
  }
}

export async function assignGameAction(gameId: string, roomId: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'teacher') return { error: 'Không có quyền' };

  try {
    await assignGame(profile.id, gameId, roomId);
    revalidatePath('/teacher/games');
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi giao bài' };
  }
}

export async function submitAnswerAction(
  sessionId: string,
  questionId: string,
  answer: unknown
) {
  const profile = await getCurrentProfile();
  if (!profile) return { error: 'Chưa đăng nhập' };

  try {
    return await submitAnswer(sessionId, profile.id, questionId, answer);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Lỗi gửi đáp án' };
  }
}
