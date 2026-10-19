/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useState } from 'react';
import { MistakeRecord, QuizQuestion } from '@/types/game';
import { sound } from '@/lib/audio';
import { Wrench, CheckCircle2, AlertTriangle, RotateCcw, X, Sparkles, ShieldCheck, ArrowLeft } from 'lucide-react';
import { RoomInteriorScene } from './RoomInteriorScene';
import { DialogFrame } from '@/components/ui/DialogFrame';
import { AnswerMark } from '@/components/ui/AnswerMark';

interface ReviewStationModalProps {
  mistakes: MistakeRecord[];
  onClose: () => void;
  onResolveMistake: (mistakeId: string, xp: number, points: number) => void;
}


export const ReviewStationModal: React.FC<ReviewStationModalProps> = ({
  mistakes: studentMistakes,
  onClose,
  onResolveMistake,
}) => {
  // Không dùng câu sai mẫu: chưa có câu sai thì hiện trạng thái rỗng
  const activeMistakes = studentMistakes;

  const [selectedMistakeId, setSelectedMistakeId] = useState(activeMistakes[0]?.id || '');
  const [retryAnswerIdx, setRetryAnswerIdx] = useState<number | null>(null);
  const [retryFeedback, setRetryFeedback] = useState<string | null>(null);
  const [resolvedIds, setResolvedIds] = useState<string[]>([]);

  const currentMistake = activeMistakes.find((m) => m.id === selectedMistakeId) || activeMistakes[0];

  const handleRetryChoice = (idx: number) => {
    setRetryAnswerIdx(idx);
    if (!currentMistake) return;

    if (idx === currentMistake.question.correctIndex) {
      sound.playSuccess();
      setRetryFeedback('Chính xác! Bạn đã hiểu rõ bản chất và sửa chữa thành công lỗi sai!');
      if (!resolvedIds.includes(currentMistake.id)) {
        setResolvedIds((prev) => [...prev, currentMistake.id]);
        onResolveMistake(currentMistake.id, 60, 50);
      }
    } else {
      sound.playError();
      setRetryFeedback('Chưa đúng rồi, đọc lại phần kiến thức ở trên rồi thử lại nhé!');
    }
  };

  return (
    <DialogFrame onClose={onClose} labelledBy="dialog-title-review" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-4xl bg-slate-900 border-2 border-orange-500/50 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-orange-950/90 via-slate-900 to-amber-950/80 border-b border-orange-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600/30 text-orange-400 border border-orange-500/50 flex items-center justify-center text-xl">
              🛠️
            </div>
            <div>
              <h2 id="dialog-title-review" className="text-base font-bold text-white flex items-center gap-2">
                Trạm Sửa Lỗi Cứu Nguy (Review Station)
              </h2>
              <p className="text-xs text-orange-300">
                Phân tích nguyên nhân sai lầm & thử thách làm lại để nhận Huy Hiệu Sao Khoa Học
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

        {/* 2D PIXEL-ART WORKSHOP INTERIOR SCENE */}
        <RoomInteriorScene roomId="review_station" />

        {/* BODY */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* LEFT: MISTAKES LIST */}
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-800 p-4 overflow-y-auto space-y-2 bg-slate-900/60">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Hồ sơ câu sai ({activeMistakes.length})</span>
              <span className="text-emerald-400 font-mono text-[11px]">
                Đã sửa: {resolvedIds.length}
              </span>
            </div>

            {activeMistakes.map((m, i) => {
              const isSelected = m.id === selectedMistakeId;
              const isFixed = resolvedIds.includes(m.id) || m.reviewed;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedMistakeId(m.id);
                    setRetryAnswerIdx(null);
                    setRetryFeedback(null);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-orange-600/20 border-orange-400 text-white'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-orange-400">
                      Lỗi #{i + 1} - {m.question.subject}
                    </span>
                    {isFixed ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã sửa
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" /> Cần sửa
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-xs mt-1 line-clamp-2">
                    {m.question.question}
                  </div>
                </button>
              );
            })}
          </div>

          {/* RIGHT: ERROR ANALYSIS & REDEMPTION RETRY */}
          {currentMistake ? (
            <div className="w-full md:w-2/3 p-6 overflow-y-auto space-y-5">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-orange-950 text-orange-300 border border-orange-800">
                  {currentMistake.question.subject} - {currentMistake.question.grade}
                </span>

                <div className="flex items-center gap-1 text-xs text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Thưởng làm lại: +60 XP, +50 EP</span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">
                  {currentMistake.question.question}
                </h3>
              </div>

              {/* DIAGNOSIS BOX: WHY USER ERRED */}
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/50 space-y-2">
                <div className="flex items-center gap-2 text-rose-300 text-xs font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Chẩn đoán sai sót:</span>
                </div>
                <p className="text-xs text-slate-300">
                  Bạn đã chọn phương án: <span className="font-bold text-rose-300">
                    {currentMistake.userSelectedIndex >= 0
                      ? currentMistake.question.options[currentMistake.userSelectedIndex]
                      : 'Hết thời gian trả lời'}
                  </span>
                </p>
              </div>

              {/* SCIENTIFIC EXPLANATION */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Kiến thức chuẩn xác KHTN:</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {currentMistake.question.explanation}
                </p>
              </div>

              {/* RETRY OPTIONS */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Thử thách sửa sai: Hãy chọn lại đáp án đúng!
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentMistake.question.options.map((opt, idx) => {
                    const isCorrect = idx === currentMistake.question.correctIndex;
                    const isSelected = idx === retryAnswerIdx;

                    let btnClass = 'bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-200';
                    if (retryAnswerIdx !== null) {
                      if (isCorrect) {
                        btnClass = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                      } else if (isSelected) {
                        btnClass = 'bg-rose-950/80 border-rose-500 text-rose-200';
                      } else {
                        btnClass = 'bg-slate-900/40 border-slate-800 text-slate-500';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleRetryChoice(idx)}
                        className={`min-h-11 p-3 text-xs text-left rounded-xl border transition cursor-pointer flex items-center gap-2 ${btnClass}`}
                      >
                        <span>{opt}</span>
                        {retryAnswerIdx !== null && <AnswerMark correct={isCorrect} chosen={isSelected} />}
                      </button>
                    );
                  })}
                </div>

                {retryFeedback && (
                  <div role="status" className={`p-3 rounded-xl border text-xs font-semibold ${
                    retryAnswerIdx === currentMistake.question.correctIndex
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-800 text-rose-300'
                  }`}>
                    {retryFeedback}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full md:w-2/3 p-8 text-center flex flex-col items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
              <h3 className="text-base font-bold text-white">Chưa có câu sai nào!</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Bạn đang làm bài rất tốt. Khi bạn chơi Quiz Arcade và gặp câu khó, câu hỏi sẽ được chuyển tới đây để phân tích!
              </p>
            </div>
          )}
        </div>
      </div>
    </DialogFrame>
  );
};
