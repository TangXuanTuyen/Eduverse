/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import { QuizQuestion } from '@/types/game';
import { sound } from '@/lib/audio';
import { Zap, Clock, Trophy, Flame, RotateCcw, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { GameJoinSection } from './GameJoinSection';
import { GameAssignmentList } from './GameAssignmentList';
import { RoomInteriorScene } from './RoomInteriorScene';
import { DialogFrame } from '@/components/ui/DialogFrame';
import { AnswerMark } from '@/components/ui/AnswerMark';

interface QuizArcadeModalProps {
  onClose: () => void;
  onFinishQuiz: (score: number, xp: number, points: number) => void;
  onRecordMistake: (question: QuizQuestion, selectedIndex: number) => void;
}

const QUESTION_BANK: QuizQuestion[] = [
  {
    id: 'q1',
    subject: 'Vật lý',
    grade: 'Lớp 7',
    question: 'Tốc độ chuyển động của một vật cho biết điều gì?',
    options: [
      'Mức độ nhanh hay chậm của chuyển động',
      'Quãng đường vật đi được trong 1 giờ',
      'Hướng chuyển động của vật',
      'Thời gian vật bắt đầu chuyển động'
    ],
    correctIndex: 0,
    explanation: 'Tốc độ là đại lượng đặc trưng cho mức độ nhanh hay chậm của chuyển động, được tính bằng v = s / t.'
  },
  {
    id: 'q2',
    subject: 'Hóa học',
    grade: 'Lớp 7',
    question: 'Ký hiệu hóa học của nguyên tố Sắt (Iron) là gì?',
    options: ['Fe', 'Cu', 'Al', 'Ag'],
    correctIndex: 0,
    explanation: 'Sắt (Iron) có ký hiệu hóa học là Fe (bắt nguồn từ tiếng Latin "Ferrum"). Cu là Đồng, Al là Nhôm, Ag là Bạc.'
  },
  {
    id: 'q3',
    subject: 'Sinh học',
    grade: 'Lớp 6',
    question: 'Bào quan nào sau đây được coi là "nhà máy năng lượng" của tế bào?',
    options: ['Lục lạp', 'Ti thể (Mitochondria)', 'Nhân tế bào', 'Không bào'],
    correctIndex: 1,
    explanation: 'Ti thể là nơi diễn ra quá trình hô hấp tế bào, phân giải chất hữu cơ giải phóng năng lượng ATP cho mọi hoạt động sống.'
  },
  {
    id: 'q4',
    subject: 'Vật lý',
    grade: 'Lớp 8',
    question: 'Đơn vị đo áp suất trong hệ đo lường quốc tế (SI) là gì?',
    options: ['Newton (N)', 'Pascal (Pa)', 'Joule (J)', 'Watt (W)'],
    correctIndex: 1,
    explanation: 'Đơn vị đo áp suất là Pascal (Pa) hoặc N/m². 1 Pa = 1 N/m².'
  },
  {
    id: 'q5',
    subject: 'Hóa học',
    grade: 'Lớp 8',
    question: 'Hiện tượng nào sau đây là hiện tượng hóa học?',
    options: [
      'Nước lỏng đông đặc thành nước đá',
      'Cồn để trong lọ hở miệng bị bay hơi',
      'Đinh sắt để ngoài không khí ẩm bị gỉ sét',
      'Hòa tan đường vào nước tạo thành nước đường'
    ],
    correctIndex: 2,
    explanation: 'Đinh sắt gỉ sinh ra chất mới là gỉ sắt (oxit sắt), nên đây là hiện tượng hóa học. Các hiện tượng còn lại chỉ là biến đổi vật lý.'
  }
];

export const QuizArcadeModal: React.FC<QuizArcadeModalProps> = ({
  onClose,
  onFinishQuiz,
  onRecordMistake,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = QUESTION_BANK[currentIdx];

  // Timer countdown
  useEffect(() => {
    if (isAnswered || isFinished) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIdx, isAnswered, isFinished]);

  const handleTimeOut = () => {
    sound.playError();
    setIsAnswered(true);
    setSelectedIdx(-1);
    setCombo(0);
    onRecordMistake(currentQ, -1);
  };

  const handleChoose = (idx: number) => {
    if (isAnswered) return;

    setSelectedIdx(idx);
    setIsAnswered(true);

    if (idx === currentQ.correctIndex) {
      sound.playSuccess();
      const points = 100 + combo * 20;
      setScore((s) => s + points);
      setCombo((c) => c + 1);
    } else {
      sound.playError();
      setCombo(0);
      // Record mistake for Review Station!
      onRecordMistake(currentQ, idx);
    }
  };

  const handleNext = () => {
    sound.playClick();
    if (currentIdx < QUESTION_BANK.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedIdx(null);
      setIsAnswered(false);
      setTimeLeft(15);
    } else {
      setIsFinished(true);
      const earnedXP = Math.round(score * 0.8) + 80;
      const earnedPoints = Math.round(score * 0.5) + 50;
      onFinishQuiz(score, earnedXP, earnedPoints);
    }
  };

  const handleRestart = () => {
    sound.playClick();
    setCurrentIdx(0);
    setScore(0);
    setCombo(0);
    setTimeLeft(15);
    setSelectedIdx(null);
    setIsAnswered(false);
    setIsFinished(false);
  };

  return (
    <DialogFrame onClose={onClose} labelledBy="dialog-title-arcade" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-purple-500/50 rounded-2xl shadow-2xl shadow-purple-950/50 flex flex-col overflow-hidden text-slate-100">
        {/* HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-950/90 via-slate-900 to-indigo-950/80 border-b border-purple-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 text-purple-400 border border-purple-500/50 flex items-center justify-center text-xl font-bold font-pixel">
              ⚡
            </div>
            <div>
              <h2 id="dialog-title-arcade" className="text-base font-bold text-white flex items-center gap-2">
                Đấu Trường Quiz Arcade (KHTN THCS)
              </h2>
              <p className="text-xs text-purple-300">
                Chinh phục câu hỏi trắc nghiệm tốc độ cao & nhận điểm thưởng
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Quay lại thành phố"
              className="min-h-11 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Quay lại thành phố</span>
            </button>
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

        {/* 2D PIXEL-ART ARCADE HALL INTERIOR SCENE */}
        <RoomInteriorScene roomId="quiz_arcade" />

        {/* JOIN LIVE GAME + ASSIGNED GAMES */}
        <div className="px-6 py-3 space-y-3">
          <GameJoinSection />
          <GameAssignmentList />
        </div>

        {/* STATUS HUD (SCORE, TIMER, COMBO) */}
        {!isFinished && (
          <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-400">
                Câu {currentIdx + 1}/{QUESTION_BANK.length}
              </span>
              <span className="px-2 py-0.5 bg-purple-950 text-purple-300 rounded font-semibold text-[10px]">
                {currentQ.subject} - {currentQ.grade}
              </span>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-1.5 font-bold font-mono text-sm">
              <Clock className={`w-4 h-4 ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-amber-400'}`} />
              <span className={timeLeft <= 5 ? 'text-rose-400' : 'text-white'}>
                {timeLeft}s
              </span>
            </div>

            {/* Score & Combo */}
            <div className="flex items-center gap-3">
              {combo > 1 && (
                <div className="flex items-center gap-1 text-amber-400 font-bold animate-bounce">
                  <Flame className="w-4 h-4 fill-amber-400" />
                  <span>x{combo} COMBO!</span>
                </div>
              )}
              <div className="font-bold font-mono text-purple-300 bg-purple-950/60 px-3 py-1 rounded-lg border border-purple-800">
                {score} ĐIỂM
              </div>
            </div>
          </div>
        )}

        {/* BODY */}
        <div className="p-6">
          {!isFinished ? (
            <div className="space-y-5">
              <div className="text-base sm:text-lg font-bold text-white leading-snug">
                {currentQ.question}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {currentQ.options.map((opt, idx) => {
                  const isCorrect = idx === currentQ.correctIndex;
                  const isChosen = idx === selectedIdx;
                  const letters = ['A', 'B', 'C', 'D'];
                  const buttonColors = [
                    'border-rose-500/60 text-rose-300 bg-rose-950/40',
                    'border-cyan-500/60 text-cyan-300 bg-cyan-950/40',
                    'border-amber-500/60 text-amber-300 bg-amber-950/40',
                    'border-emerald-500/60 text-emerald-300 bg-emerald-950/40'
                  ];

                  let style = 'bg-slate-800/90 hover:bg-slate-700 border-2 border-slate-700 text-slate-100 shadow-md hover:border-purple-400';
                  if (isAnswered) {
                    if (isCorrect) {
                      style = 'bg-emerald-950/90 border-2 border-emerald-400 text-emerald-100 font-bold shadow-lg shadow-emerald-500/20';
                    } else if (isChosen) {
                      style = 'bg-rose-950/90 border-2 border-rose-500 text-rose-200 shadow-lg shadow-rose-500/20';
                    } else {
                      style = 'bg-slate-900/40 border-2 border-slate-800 text-slate-500';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleChoose(idx)}
                      className={`p-3.5 sm:p-4 text-xs sm:text-sm text-left rounded-xl transition-all transform active:scale-98 cursor-pointer flex items-center gap-3 ${style}`}
                    >
                      <span className={`w-8 h-8 rounded-lg border-2 font-mono font-bold flex items-center justify-center text-xs shrink-0 shadow-inner ${buttonColors[idx]}`}>
                        {letters[idx]}
                      </span>
                      <span className="font-semibold leading-relaxed">{opt}</span>
                      {isAnswered && <AnswerMark correct={isCorrect} chosen={isChosen} />}
                    </button>
                  );
                })}
              </div>

              {/* Feedback box on answered */}
              {isAnswered && (
                <div role="status" className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs font-semibold mb-1">
                    {selectedIdx === currentQ.correctIndex ? (
                      <span className="text-emerald-400 font-bold">Chính xác! +{100 + (combo - 1) * 20} Điểm</span>
                    ) : (
                      <span className="text-rose-400 font-bold">
                        {selectedIdx === -1 ? 'Hết giờ rồi!' : 'Chưa đúng rồi, xem giải thích nhé!'} (Đã lưu vào Trạm Sửa Lỗi để ôn lại)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{currentQ.explanation}</p>
                </div>
              )}

              {/* Next Button */}
              {isAnswered && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition active:scale-95 cursor-pointer"
                  >
                    <span>{currentIdx < QUESTION_BANK.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả tổng kết'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* FINISHED SUMMARY SCREEN */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto text-3xl">
                <Trophy className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">HOÀN THÀNH ĐẤU TRƯỜNG!</h3>
                <p className="text-xs text-purple-300 mt-1">
                  Bạn đã xuất sắc vượt qua các câu hỏi Khoa học tự nhiên hôm nay!
                </p>
              </div>

              <div className="inline-block p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="text-3xl font-black font-mono text-purple-400">
                  {score}
                </div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  Tổng điểm đạt được
                </div>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl max-w-sm mx-auto text-xs text-emerald-300">
                Đã mở khóa Phòng thí nghiệm STEM và nhận thêm EduPoints!
              </div>

              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Chơi lại ván mới</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-lg shadow-purple-600/30"
                >
                  Trở về Thành Phố
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DialogFrame>
  );
};
