/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { sound } from '@/lib/audio';
import { BookOpen, CheckCircle, CheckCircle2, Lightbulb, Atom, Dna, X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { RoomInteriorScene } from './RoomInteriorScene';
import { LessonViewer } from './LessonViewer';
import { DialogFrame } from '@/components/ui/DialogFrame';
import { AnswerMark } from '@/components/ui/AnswerMark';

type DynamicLesson = {
  id: string;
  title: string;
  description: string;
  subject: string;
  grade_level: number;
  chapter: string;
  thumbnail_url: string | null;
};

interface LibraryModalProps {
  onClose: () => void;
  onCompleteLesson: (lessonId: string, xp: number, points: number) => void;
}

const LESSONS = [
  {
    id: 'optics_law',
    subject: 'Vật lý 7',
    icon: Lightbulb,
    title: 'Định luật phản xạ ánh sáng',
    summary: 'Tìm hiểu về tia tới, tia phản xạ, góc tới (i) và góc phản xạ (i\').',
    sections: [
      {
        heading: '1. Hiện tượng phản xạ ánh sáng',
        body: 'Khi chiếu một chùm sáng vào bề mặt một vật nhẵn bóng (như gương phẳng), chùm sáng bị hắt trở lại môi trường trong suốt cũ. Hiện tượng này gọi là hiện tượng phản xạ ánh sáng.'
      },
      {
        heading: '2. Định luật phản xạ ánh sáng',
        body: '• Tia phản xạ nằm trong mặt phẳng tới (mặt phẳng chứa tia tới và pháp tuyến tại điểm tới).\n• Góc phản xạ luôn bằng góc tới: i\' = i.\n• Ví dụ: Nếu góc tới bằng 30° thì góc phản xạ cũng bằng 30°.'
      },
      {
        heading: '3. Tính chất ảnh tạo bởi gương phẳng',
        body: '• Ảnh ảo không hứng được trên màn chắn.\n• Độ lớn của ảnh bằng độ lớn của vật.\n• Khoảng cách từ một điểm của vật đến gương phẳng bằng khoảng cách từ ảnh của điểm đó đến gương phẳng.'
      }
    ],
    quiz: {
      question: 'Nếu góc tới i = 45° thì góc tạo bởi tia tới và tia phản xạ là bao nhiêu?',
      options: ['45°', '90°', '0°', '180°'],
      correctIndex: 1,
      explanation: 'Theo định luật phản xạ ánh sáng: i\' = i = 45°. Do đó góc tạo bởi tia tới và tia phản xạ là i + i\' = 45° + 45° = 90°.'
    }
  },
  {
    id: 'atom_periodic',
    subject: 'Hóa học 7',
    icon: Atom,
    title: 'Cấu tạo nguyên tử & Bảng tuần hoàn',
    summary: 'Proton (+), Neutron (0), Electron (-) và nguyên lý sắp xếp các nguyên tố hóa học.',
    sections: [
      {
        heading: '1. Cấu tạo của nguyên tử',
        body: 'Mọi chất trong tự nhiên đều được cấu tạo từ các hạt cực kỳ nhỏ bé gọi là nguyên tử:\n• Hạt nhân (ở tâm): Gồm proton mang điện tích dương (+) và neutron không mang điện tích.\n• Vỏ nguyên tử: Gồm các hạt electron mang điện tích âm (-) chuyển động quanh hạt nhân.\n• Trong nguyên tử trung hòa về điện: Số proton = Số electron.'
      },
      {
        heading: '2. Bảng tuần hoàn các nguyên tố hóa học',
        body: '• Do nhà bác học Mendeleev đặt nền móng.\n• Các nguyên tố được xếp theo chiều tăng dần của điện tích hạt nhân nguyên tử.\n• Gồm: Ô nguyên tố, Chu kỳ (hàng ngang) và Nhóm (cột dọc).'
      }
    ],
    quiz: {
      question: 'Hạt nào mang điện tích âm và chuyển động ở lớp vỏ nguyên tử?',
      options: ['Proton', 'Neutron', 'Electron', 'Hạt nhân'],
      correctIndex: 2,
      explanation: 'Electron mang điện tích âm (-) và chuyển động thành các lớp xung quanh hạt nhân.'
    }
  },
  {
    id: 'plant_cell_photosynthesis',
    subject: 'Sinh học 6-7',
    icon: Dna,
    title: 'Tế bào thực vật & Quá trình quang hợp',
    summary: 'Cấu tạo tế bào, bào quan lục lạp và phương trình tổng hợp chất hữu cơ từ ánh sáng mặt trời.',
    sections: [
      {
        heading: '1. Cấu tạo tế bào thực vật',
        body: 'Tế bào là đơn vị cơ bản cấu tạo nên sinh vật:\n• Thành tế bào: Giúp tế bào có hình dạng cố định và bảo vệ tế bào.\n• Màng tế bào: Kiểm soát các chất ra vào tế bào.\n• Tế bào chất & Nhân: Chứa vật chất di truyền điều khiển hoạt động sống.\n• Lục lạp: Chứa sắc tố diệp lục, hấp thụ ánh sáng để quang hợp.'
      },
      {
        heading: '2. Phương trình quang hợp',
        body: 'Dưới tác dụng của ánh sáng mặt trời và chất diệp lục:\nNước + Khí Carbon dioxide ➔ Glucose (Chất hữu cơ) + Khí Oxygen.'
      }
    ],
    quiz: {
      question: 'Khí nào được thực vật giải phóng ra môi trường trong quá trình quang hợp?',
      options: ['Khí Oxygen (O₂)', 'Khí Carbon dioxide (CO₂)', 'Khí Nitrogen (N₂)', 'Khí Methane (CH₄)'],
      correctIndex: 0,
      explanation: 'Quang hợp hấp thụ CO₂ và giải phóng khí Oxygen (O₂) giúp điều hòa bầu khí quyển.'
    }
  }
];

export const LibraryModal: React.FC<LibraryModalProps> = ({
  onClose,
  onCompleteLesson,
}) => {
  const [selectedLessonId, setSelectedLessonId] = useState(LESSONS[0].id);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [dynamicLessons, setDynamicLessons] = useState<DynamicLesson[]>([]);
  const [viewingLesson, setViewingLesson] = useState<string | null>(null);
  const [lessonData, setLessonData] = useState<Record<string, unknown> | null>(null);
  const [tasks, setTasks] = useState<Array<{ id: string; resource_id: string; title: string; completed?: boolean }>>([]);
  const [completingTask, setCompletingTask] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/lessons')
      .then((r) => r.json())
      .then((d) => setDynamicLessons(Array.isArray(d) ? d : []))
      .catch(() => {});

    fetch('/api/student-assignments')
      .then((r) => r.json())
      .then((data) => {
        const lessonTasks = (data.assignments ?? [])
          .filter((a: Record<string, unknown>) => a.assignment_type === 'lesson')
          .map((a: Record<string, unknown>) => ({ id: a.id, resource_id: a.resource_id, title: a.title }));
        setTasks(lessonTasks);
      })
      .catch(() => {});
  }, []);

  const completeTask = useCallback(async (assignmentId: string) => {
    setCompletingTask(assignmentId);
    try {
      const res = await fetch('/api/task-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment_id: assignmentId }),
      });
      if (res.ok) {
        setTasks((prev) => prev.map((t) => t.id === assignmentId ? { ...t, completed: true } : t));
      }
    } catch { /* ignore */ }
    setCompletingTask(null);
  }, []);

  async function openDynamicLesson(id: string) {
    setViewingLesson(id);
    try {
      const res = await fetch(`/api/lessons/${id}`);
      const data = await res.json();
      setLessonData(data);
    } catch {
      setViewingLesson(null);
    }
  }

  const activeLesson = LESSONS.find((l) => l.id === selectedLessonId) || LESSONS[0];

  const handleSelectAnswer = (idx: number) => {
    if (hasAnswered) return;
    setSelectedAnswer(idx);
    setHasAnswered(true);

    if (idx === activeLesson.quiz.correctIndex) {
      sound.playSuccess();
      if (!completedLessons.includes(activeLesson.id)) {
        setCompletedLessons((prev) => [...prev, activeLesson.id]);
        onCompleteLesson(activeLesson.id, 80, 50);
      }
    } else {
      sound.playError();
    }
  };

  const handleNextLesson = () => {
    const curIdx = LESSONS.findIndex((l) => l.id === selectedLessonId);
    if (curIdx < LESSONS.length - 1) {
      setSelectedLessonId(LESSONS[curIdx + 1].id);
      setSelectedAnswer(null);
      setHasAnswered(false);
    }
  };

  return (
    <DialogFrame onClose={onClose} labelledBy="dialog-title-library" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      {/* Dynamic lesson viewer overlay */}
      {viewingLesson && lessonData && (lessonData as { lesson?: unknown }).lesson ? (
        <div className="fixed inset-0 z-[60] bg-slate-950 overflow-auto">
          <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Bài học trực quan</h2>
            <button
              onClick={() => { setViewingLesson(null); setLessonData(null); }}
              className="min-h-[44px] px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-white"
            >
              Đóng
            </button>
          </div>
          <LessonViewer
            lessonId={((lessonData as { lesson: { id: string } }).lesson).id}
            title={((lessonData as { lesson: { title: string } }).lesson).title}
            content={((lessonData as { lesson: { content: unknown } }).lesson).content as never}
            initialStep={(lessonData as { progress?: { currentStep?: number } }).progress?.currentStep}
            completedSteps={(lessonData as { progress?: { completedSteps?: number[] } }).progress?.completedSteps}
            notes={(lessonData as { notes?: Record<number, { prediction: string; observation: string; explanation: string }> }).notes}
            recommendation={(lessonData as { recommendation?: string }).recommendation}
          />
        </div>
      ) : null}

      <div className="w-full max-w-4xl bg-slate-900 border-2 border-sky-500/50 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-sky-950/80 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600/30 text-sky-400 border border-sky-500/40 flex items-center justify-center text-xl">
              📚
            </div>
            <div>
              <h2 id="dialog-title-library" className="text-base font-bold text-white flex items-center gap-2">
                Thư Viện Tri Thức KHTN (Library)
              </h2>
              <p className="text-xs text-sky-300">
                Lý thuyết Khoa học tự nhiên THCS (Vật lý - Hóa học - Sinh học)
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

        {/* 2D PIXEL-ART LIBRARY INTERIOR SCENE (INTERACTIVE BOOKSHELVES & READING DESK) */}
        <RoomInteriorScene 
          roomId="library" 
          activeStationId={selectedLessonId}
          onSelectStation={(id) => {
            sound.playClick();
            setSelectedLessonId(id);
            setSelectedAnswer(null);
            setHasAnswered(false);
          }}
          completedStations={completedLessons}
          npcDialogue="Cô Thủ Thư Lan: 'Chào em! Em hãy nhấp vào các kệ sách bên trên hoặc danh sách chuyên đề để đọc lý thuyết và giải câu đố nhận +80 XP nhé!'"
        />

        {/* LIBRARY STUDY PROGRESS BAR */}
        <div className="bg-slate-950/70 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">TIẾN ĐỘ ĐỌC SÁCH:</span>
            <span className="text-slate-200 font-semibold">{completedLessons.length}/{LESSONS.length} Chuyên đề đã hoàn thành</span>
          </div>
          <div className="text-[11px] text-amber-300 font-mono">
            Phần thưởng: +80 XP & +50 EP / bài
          </div>
        </div>

        {/* BODY (TWO COLUMNS: LESSON LIST & CONTENT VIEWER) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* LEFT: LESSON SELECTOR */}
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-800 p-4 overflow-y-auto space-y-2 bg-slate-950/60">
            {dynamicLessons.length > 0 && (
              <>
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>BÀI HỌC TRỰC QUAN:</span>
                </div>
                {dynamicLessons.map((dl) => (
                  <button
                    key={dl.id}
                    onClick={() => openDynamicLesson(dl.id)}
                    className="w-full text-left p-3 rounded-xl border bg-cyan-950/20 border-cyan-500/30 text-slate-200 hover:bg-cyan-900/30 transition cursor-pointer flex flex-col gap-1"
                  >
                    <span className="text-[10px] text-cyan-400 font-bold">{dl.chapter || dl.subject} · Lớp {dl.grade_level}</span>
                    <span className="font-bold text-xs text-white">{dl.title}</span>
                    {dl.description && <p className="text-[11px] text-slate-400 line-clamp-1">{dl.description}</p>}
                  </button>
                ))}
                <div className="border-t border-slate-800 my-2" />
              </>
            )}
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>KỆ SÁCH CHUYÊN ĐỀ KHTN:</span>
              <span className="text-[10px] text-slate-400 font-normal">Nhấp chọn</span>
            </div>
            {LESSONS.map((l, idx) => {
              const isSelected = l.id === selectedLessonId;
              const isDone = completedLessons.includes(l.id);
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedLessonId(l.id);
                    setSelectedAnswer(null);
                    setHasAnswered(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-400/80 text-white shadow-lg ring-1 ring-amber-400/30'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-amber-400">
                      Kệ #{idx + 1} · {l.subject}
                    </span>
                    <span className="flex items-center gap-1">
                      {tasks.find((t) => t.resource_id === l.id) && (
                        <span className={`text-[10px] px-1 py-0.5 rounded font-bold ${tasks.find((t) => t.resource_id === l.id)?.completed ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'}`}>
                          {tasks.find((t) => t.resource_id === l.id)?.completed ? '✓' : 'GV'}
                        </span>
                      )}
                      {isDone ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Đã đọc</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Chưa đọc</span>
                      )}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-white">{l.title}</div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {l.summary}
                  </p>
                </button>
              );
            })}
          </div>

          {/* RIGHT: READING MATERIAL & CHECK QUIZ */}
          <div className="w-full md:w-2/3 p-6 overflow-y-auto space-y-6">
            <div>
              <div className="inline-block px-2.5 py-0.5 bg-sky-950 text-sky-300 border border-sky-800 rounded text-[11px] font-semibold mb-2">
                {activeLesson.subject}
              </div>
              <h1 className="text-xl font-bold text-white">{activeLesson.title}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <a href="/student/virtual-lab" className="text-[11px] px-2.5 py-1 rounded-lg bg-orange-900/40 text-orange-300 hover:bg-orange-900/60 transition flex items-center gap-1">
                  🔬 Thí nghiệm liên quan
                </a>
                <a href="/student/world-3d" className="text-[11px] px-2.5 py-1 rounded-lg bg-cyan-900/40 text-cyan-300 hover:bg-cyan-900/60 transition flex items-center gap-1">
                  🌐 Mô hình 3D liên quan
                </a>
              </div>
            </div>

            {/* Structured Sections */}
            <div className="space-y-4">
              {activeLesson.sections.map((sec, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
                  <h3 className="text-sm font-bold text-sky-300 mb-1.5">{sec.heading}</h3>
                  <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {sec.body}
                  </div>
                </div>
              ))}
            </div>

            {/* MINI CHECK QUESTION */}
            <div className="mt-6 p-4 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Câu hỏi củng cố (+80 XP & +50 EP)
                </span>
              </div>

              <div className="text-xs sm:text-sm font-semibold text-white mb-3">
                {activeLesson.quiz.question}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeLesson.quiz.options.map((opt, idx) => {
                  const isCorrect = idx === activeLesson.quiz.correctIndex;
                  const isSelected = idx === selectedAnswer;

                  let btnStyle = 'bg-slate-700/60 border-slate-600 text-slate-200 hover:bg-slate-700';
                  if (hasAnswered) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                    } else if (isSelected) {
                      btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-200';
                    } else {
                      btnStyle = 'bg-slate-800/40 border-slate-700 text-slate-500';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={hasAnswered}
                      onClick={() => handleSelectAnswer(idx)}
                      className={`min-h-11 p-2.5 text-xs text-left rounded-lg border transition cursor-pointer flex items-center gap-2 ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {hasAnswered && <AnswerMark correct={isCorrect} chosen={isSelected} />}
                    </button>
                  );
                })}
              </div>

              {hasAnswered && (
                <div className="mt-3 p-3 rounded-lg bg-slate-900 border border-slate-700 text-xs">
                  <div className="font-semibold text-slate-200 mb-1">
                    {selectedAnswer === activeLesson.quiz.correctIndex ? (
                      <span className="text-emerald-400">Chính xác! Xuất sắc!</span>
                    ) : (
                      <span className="text-rose-400">Chưa chính xác!</span>
                    )}
                  </div>
                  <p className="text-slate-400">{activeLesson.quiz.explanation}</p>
                </div>
              )}
            </div>

            {/* Bottom Next Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleNextLesson}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Bài học tiếp theo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DialogFrame>
  );
};
