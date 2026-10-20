'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { BuildingId } from '@/types/game';
import { ProgressionSystem, QUEST_IDS } from '@/game/engine/progression';
import { useStudentGame } from '@/components/student/StudentGameProvider';
import { STUDENT_HOME } from '@/lib/student-routes';
import { LibraryModal } from '@/components/learning/LibraryModal';
import { QuizArcadeModal } from '@/components/learning/QuizArcadeModal';
import { ReviewStationModal } from '@/components/learning/ReviewStationModal';
import { StemLabModal } from '@/components/learning/StemLabModal';
import { SchoolModal } from '@/components/learning/SchoolModal';
import { AchievementPlazaModal } from '@/components/learning/AchievementPlazaModal';

/** Hiển thị hộp thoại của một địa điểm; dùng chung cho mọi route /student/<địa điểm>. */
export function BuildingRoute({ id }: { id: BuildingId }) {
  const game = useStudentGame();
  const router = useRouter();
  const unlocked = ProgressionSystem.isBuildingUnlocked(id, game.progress).unlocked;
  const { completeQuestVisit } = game;

  // Mở thẳng URL của địa điểm chưa mở khóa → quay về bản đồ
  useEffect(() => {
    if (!unlocked) router.replace(STUDENT_HOME);
  }, [unlocked, router]);

  // Vào trường (từ bản đồ hay mở thẳng URL) đều hoàn thành nhiệm vụ nhập học
  useEffect(() => {
    if (id === 'school') completeQuestVisit(QUEST_IDS.schoolWelcome);
  }, [id, completeQuestVisit]);

  if (!unlocked) return null;

  switch (id) {
    case 'library':
      return <LibraryModal onClose={game.closeBuilding} onCompleteLesson={game.completeLibraryLesson} />;
    case 'quiz_arcade':
      return (
        <QuizArcadeModal
          onClose={game.closeBuilding}
          onFinishQuiz={game.finishQuiz}
          onRecordMistake={game.recordMistake}
        />
      );
    case 'review_station':
      return (
        <ReviewStationModal
          onClose={game.closeBuilding}
        />
      );
    case 'stem_lab':
      return <StemLabModal onClose={game.closeBuilding} onCompleteExperiment={game.completeStemExperiment} />;
    case 'school':
      return <SchoolModal progress={game.progress} onClose={game.closeBuilding} onClaimQuest={game.claimQuest} />;
    case 'achievement_plaza':
      return (
        <AchievementPlazaModal
          character={game.character}
          progress={game.progress}
          onClose={game.closeBuilding}
          onOpenCustomizer={() => game.setEditingCharacter(true)}
        />
      );
  }
}
