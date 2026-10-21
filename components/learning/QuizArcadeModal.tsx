/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Swords, FlaskConical, Trophy, X, ArrowLeft, FileText, Clock, AlertCircle } from 'lucide-react';
import { GameJoinSection } from './GameJoinSection';
import { GameAssignmentList } from './GameAssignmentList';
import { RoomInteriorScene } from './RoomInteriorScene';
import { DialogFrame } from '@/components/ui/DialogFrame';
import { QuickChallengeClient } from '@/components/games/QuickChallengeClient';
import { BossBattle } from '@/components/games/BossBattle';
import { AssignmentQuizTaker } from '@/components/games/AssignmentQuizTaker';

interface QuizArcadeModalProps {
  onClose: () => void;
  assignmentId?: string | null;
}

type ArcadeScreen = 'menu' | 'quick_challenge' | 'boss_battle' | 'assignment_quiz';

type QuizAssignment = {
  id: string;
  title: string;
  description: string;
  due_at: string | null;
  rooms: { name: string };
};

export const QuizArcadeModal: React.FC<QuizArcadeModalProps> = ({
  onClose,
  assignmentId,
}) => {
  const [screen, setScreen] = useState<ArcadeScreen>(assignmentId ? 'assignment_quiz' : 'menu');
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(assignmentId ?? null);
  const [quizAssignments, setQuizAssignments] = useState<QuizAssignment[]>([]);

  useEffect(() => {
    fetch('/api/student-assignments')
      .then((r) => r.json())
      .then((data) => {
        const quizzes = (data.assignments ?? [])
          .filter((a: Record<string, unknown>) => !a.assignment_type || a.assignment_type === 'quiz');
        setQuizAssignments(quizzes);
      })
      .catch(() => {});
  }, []);

  const GAME_MODES = [
    {
      id: 'quick_challenge' as const,
      icon: Zap,
      title: 'Thử Thách Nhanh',
      desc: '5 câu hỏi thích ứng, không giới hạn thời gian',
      color: 'purple',
      border: 'border-purple-500/50',
      bg: 'bg-purple-600/20',
      iconColor: 'text-purple-400',
    },
    {
      id: 'boss_battle' as const,
      icon: Swords,
      title: 'Đấu Trùm',
      desc: 'Đánh boss bằng kiến thức, streak = chiêu đặc biệt',
      color: 'red',
      border: 'border-red-500/50',
      bg: 'bg-red-600/20',
      iconColor: 'text-red-400',
    },
  ];

  return (
    <DialogFrame onClose={onClose} labelledBy="dialog-title-arcade" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-purple-500/50 rounded-2xl shadow-2xl shadow-purple-950/50 flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-950/90 via-slate-900 to-indigo-950/80 border-b border-purple-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 text-purple-400 border border-purple-500/50 flex items-center justify-center text-xl font-bold">
              ⚡
            </div>
            <div>
              <h2 id="dialog-title-arcade" className="text-base font-bold text-white">
                Đấu Trường Quiz Arcade
              </h2>
              <p className="text-xs text-purple-300">
                Luyện tập KHTN qua game
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {screen !== 'menu' && (
              <button
                type="button"
                onClick={() => setScreen('menu')}
                className="min-h-11 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Menu</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Đóng [Esc]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {screen === 'menu' && <RoomInteriorScene roomId="quiz_arcade" />}

        {/* BODY */}
        <div className="p-6 overflow-y-auto">
          {screen === 'menu' && (
            <div className="space-y-4">
              {/* Join + Assignments */}
              <GameJoinSection />
              <GameAssignmentList />

              {/* Quiz assignments from teacher */}
              {quizAssignments.length > 0 && (
                <div className="bg-slate-900/80 border border-blue-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-blue-400">
                    <FileText size={20} />
                    <span className="font-bold text-sm">Bài kiểm tra từ giáo viên</span>
                  </div>
                  <div className="space-y-2">
                    {quizAssignments.slice(0, 5).map((a) => {
                      const now = new Date();
                      const overdue = a.due_at && new Date(a.due_at) < now;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            setActiveAssignmentId(a.id);
                            setScreen('assignment_quiz');
                          }}
                          className="w-full flex items-center justify-between bg-slate-800/60 rounded-lg p-3 hover:bg-slate-700/60 transition text-left cursor-pointer"
                        >
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">📝 {a.title}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span>{a.rooms.name}</span>
                              {overdue ? (
                                <span className="text-red-400 flex items-center gap-0.5">
                                  <AlertCircle size={10} /> Quá hạn
                                </span>
                              ) : a.due_at ? (
                                <span className="text-amber-400 flex items-center gap-0.5">
                                  <Clock size={10} /> Hạn: {new Date(a.due_at).toLocaleDateString('vi-VN')}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <span className="rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-2 text-xs text-white font-medium min-h-[44px] flex items-center gap-1.5 shrink-0">
                            Làm bài →
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Game modes */}
              <div className="grid gap-3">
                {GAME_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setScreen(mode.id)}
                    className={`w-full p-4 rounded-xl border ${mode.border} ${mode.bg} hover:bg-opacity-40 flex items-center gap-4 transition cursor-pointer text-left min-h-[64px]`}
                  >
                    <mode.icon className={`w-8 h-8 ${mode.iconColor} shrink-0`} />
                    <div>
                      <div className="text-sm font-bold text-white">{mode.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{mode.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {screen === 'quick_challenge' && (
            <QuickChallengeClient onClose={() => setScreen('menu')} />
          )}

          {screen === 'boss_battle' && (
            <BossBattle onClose={() => setScreen('menu')} />
          )}

          {screen === 'assignment_quiz' && activeAssignmentId && (
            <AssignmentQuizTaker
              assignmentId={activeAssignmentId}
              onBack={() => {
                setActiveAssignmentId(null);
                setScreen('menu');
              }}
            />
          )}
        </div>
      </div>
    </DialogFrame>
  );
};
