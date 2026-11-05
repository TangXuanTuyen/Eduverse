'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { sound } from '@/lib/audio';
import { Wrench, CheckCircle2, AlertTriangle, RotateCcw, X, Sparkles, ShieldCheck, ArrowLeft } from 'lucide-react';
import { RoomInteriorScene } from './RoomInteriorScene';
import { DialogFrame } from '@/components/ui/DialogFrame';
import { AnswerMark } from '@/components/ui/AnswerMark';

type ReviewItem = {
  id: string;
  sourceQuestionId: string | null;
  sourceLessonId: string | null;
  sourceBlockKey: string | null;
  questionContent: string;
  questionOptions: { id: string; text: string }[] | null;
  questionType: string;
  explanation: string;
  skillTags: string[];
  difficulty: number;
  wrongCount: number;
  intervalDays: number;
  nextReviewAt: string;
  isDue?: boolean;
  lessonTitle?: string | null;
  chapter?: string | null;
};

const TODAY_LIMIT = 10;
const VIEW_STORAGE_KEY = 'eduverse.review.view';
type ReviewView = 'today' | 'byLesson';

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
}

type ReviewStats = {
  totalItems: number;
  dueNow: number;
  masteredThisWeek: number;
};

type Phase = 'explain' | 'retry' | 'result';

interface ReviewStationModalProps {
  onClose: () => void;
}

export const ReviewStationModal: React.FC<ReviewStationModalProps> = ({ onClose }) => {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('explain');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation: string; xpAwarded: number } | null>(null);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/review');
      const data = await res.json();
      setItems(data.items ?? []);
      setStats(data.stats ?? null);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const current = items[selectedIdx];

  const [view, setView] = useState<ReviewView>('today');

  // Nhớ cách xem của học sinh; đọc sau khi mount để tránh lệch khi render phía server
  useEffect(() => {
    try {
      if (localStorage.getItem(VIEW_STORAGE_KEY) === 'byLesson') setView('byLesson');
    } catch { /* trình duyệt chặn lưu trữ: vẫn dùng mặc định */ }
  }, []);

  const changeView = (next: ReviewView) => {
    sound.playClick();
    setView(next);
    try { localStorage.setItem(VIEW_STORAGE_KEY, next); } catch { /* bỏ qua */ }
  };

  // Ôn hôm nay: các câu đến hạn, giữ chỉ số gốc để chọn đúng câu
  const dueItems = useMemo(
    () => items.map((item, index) => ({ item, index })).filter((x) => x.item.isDue),
    [items],
  );

  // Theo bài: nhóm theo chương rồi theo bài; câu không thuộc bài học nằm trong nhóm riêng
  const groups = useMemo(() => {
    const map = new Map<string, { key: string; title: string; chapter: string | null; entries: { item: ReviewItem; index: number }[] }>();
    items.forEach((item, index) => {
      const key = item.sourceLessonId ?? 'bank';
      let group = map.get(key);
      if (!group) {
        group = {
          key,
          title: item.lessonTitle ?? 'Bài giao & trò chơi',
          chapter: item.sourceLessonId ? (item.chapter ?? 'Khác') : 'Bài giao & trò chơi',
          entries: [],
        };
        map.set(key, group);
      }
      group.entries.push({ item, index });
    });
    return [...map.values()];
  }, [items]);

  const renderItem = (m: ReviewItem, i: number) => {
    const isSelected = i === selectedIdx;
    const isFixed = resolvedIds.has(m.id);
    return (
      <button key={m.id} type="button" onClick={() => selectItem(i)} className={`w-full text-left p-3 rounded-xl border transition cursor-pointer ${isSelected ? 'bg-orange-600/20 border-orange-400 text-white' : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-orange-400 truncate">
            {m.lessonTitle ? `Từ: ${m.lessonTitle}` : 'Từ: Bài giao & trò chơi'}
          </span>
          {isFixed ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" /> Đã sửa
            </span>
          ) : m.isDue ? (
            <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" /> Đến hạn
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 shrink-0">Ôn lại {formatReviewDate(m.nextReviewAt)}</span>
          )}
        </div>
        <div className="font-semibold text-xs mt-1 line-clamp-2">{m.questionContent}</div>
      </button>
    );
  };

  const handleRetry = async (optionId: string) => {
    if (!current || phase !== 'retry') return;
    setSelectedAnswer(optionId);

    try {
      const res = await fetch('/api/review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: current.id,
          answer: optionId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        // Lỗi máy chủ không phải câu trả lời sai: cho thử lại, không trừ gì
        setSelectedAnswer(null);
        setFeedback({ isCorrect: false, explanation: data.error ?? 'Không gửi được đáp án, em thử lại nhé.', xpAwarded: 0 });
        setPhase('result');
        return;
      }
      setFeedback(data);
      setPhase('result');

      if (data.isCorrect) {
        sound.playSuccess();
        setResolvedIds((prev) => new Set(prev).add(current.id));
      } else {
        sound.playError();
      }
    } catch {
      setFeedback({ isCorrect: false, explanation: 'Lỗi kết nối', xpAwarded: 0 });
      setPhase('result');
    }
  };

  const selectItem = (idx: number) => {
    sound.playClick();
    setSelectedIdx(idx);
    setPhase('explain');
    setSelectedAnswer(null);
    setTypedAnswer('');
    setFeedback(null);
  };

  const goToRetry = () => {
    setPhase('retry');
    setSelectedAnswer(null);
    setTypedAnswer('');
    setFeedback(null);
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
              <h2 id="dialog-title-review" className="text-base font-bold text-white">
                Trạm Sửa Lỗi
              </h2>
              <p className="text-xs text-orange-300">
                {stats ? `${stats.dueNow} câu cần ôn · ${stats.masteredThisWeek} đã sửa` : 'Đang tải...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} aria-label="Quay lại" className="min-h-11 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Quay lại</span>
            </button>
            <button type="button" onClick={onClose} aria-label="Đóng" className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <RoomInteriorScene roomId="review_station" />

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* LEFT: ITEMS LIST */}
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-800 p-4 overflow-y-auto space-y-3 bg-slate-900/60">
            <div role="tablist" aria-label="Cách xem câu cần ôn" className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-800/80">
              {(['today', 'byLesson'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={view === v}
                  onClick={() => changeView(v)}
                  className={`min-h-11 rounded-lg text-xs font-bold transition ${view === v ? 'bg-orange-600/40 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {v === 'today' ? `Ôn hôm nay (${dueItems.length})` : `Theo bài (${items.length})`}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-emerald-400 font-mono text-right">Đã sửa: {resolvedIds.size}</div>

            {loading && <div className="text-xs text-slate-500 animate-pulse py-4 text-center">Đang tải...</div>}

            {!loading && items.length === 0 && (
              <div className="text-center py-8 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm text-emerald-300 font-medium">Tuyệt vời!</p>
                <p className="text-xs text-slate-400">Không có câu nào cần ôn lại. Hãy tiếp tục học nhé!</p>
              </div>
            )}

            {!loading && items.length > 0 && view === 'today' && dueItems.length === 0 && (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
                <p className="text-sm text-emerald-300 font-medium">Hôm nay không có câu nào đến hạn</p>
                <p className="text-xs text-slate-400">Xem tab "Theo bài" để biết khi nào mỗi câu sẽ được ôn lại.</p>
              </div>
            )}

            {view === 'today' && dueItems.length > 0 && (
              <p className="text-[11px] text-slate-400">Hôm nay em nên ôn {Math.min(dueItems.length, TODAY_LIMIT)} câu.</p>
            )}
            {view === 'today' && dueItems.slice(0, TODAY_LIMIT).map(({ item, index }) => renderItem(item, index))}

            {view === 'byLesson' && groups.map((g) => (
              <div key={g.key} className="space-y-1.5">
                <div className="text-[11px] font-bold text-sky-300 uppercase tracking-wider pt-2">{g.chapter}</div>
                <div className="text-xs font-semibold text-slate-200">
                  {g.title} <span className="text-slate-500 font-normal">· {g.entries.length} câu</span>
                </div>
                {g.entries.map(({ item, index }) => renderItem(item, index))}
              </div>
            ))}
          </div>

          {/* RIGHT: REVIEW FLOW */}
          {current ? (
            <div className="w-full md:w-2/3 p-6 overflow-y-auto space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {current.skillTags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-950 text-orange-300 border border-orange-800">{t}</span>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+40 XP khi sửa đúng</span>
                </div>
              </div>

              <h3 className="text-base font-bold text-white">{current.questionContent}</h3>

              {/* Phase: Explain */}
              {phase === 'explain' && (
                <>
                  <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                    <div className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Em hãy đọc giải thích trước khi thử lại:</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">{current.explanation}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <p className="text-xs text-amber-300 font-medium">
                      💡 Em hãy suy nghĩ: Vì sao đáp án trước đó của em chưa đúng? Kiến thức nào em cần ghi nhớ?
                    </p>
                  </div>

                  <button type="button" onClick={goToRetry} className="w-full min-h-11 px-4 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-sm text-white font-bold transition">
                    <RotateCcw className="w-4 h-4 inline mr-2" />
                    Thử lại ngay!
                  </button>
                </>
              )}

              {/* Phase: Retry */}
              {phase === 'retry' && (
                <div className="space-y-3">
                  {current.questionOptions && current.questionOptions.length > 0 ? (
                    <>
                      <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                        Hãy chọn đáp án đúng:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {current.questionOptions.map((opt: { id: string; text: string }) => (
                          <button key={opt.id} type="button" onClick={() => handleRetry(opt.id)} disabled={selectedAnswer !== null} className="min-h-11 p-3 text-xs text-left rounded-xl border transition cursor-pointer bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-200 disabled:opacity-60">
                            <span className="font-bold text-cyan-400 mr-2">{opt.id.toUpperCase()}.</span>
                            {opt.text}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    // Câu trả lời ngắn (ví dụ từ bài học): không có lựa chọn, học sinh tự gõ
                    <form
                      className="space-y-2.5"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const value = typedAnswer.trim();
                        if (value) handleRetry(value);
                      }}
                    >
                      <label htmlFor="review-short-answer" className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
                        Em hãy gõ câu trả lời:
                      </label>
                      <input
                        id="review-short-answer"
                        type="text"
                        value={typedAnswer}
                        onChange={(e) => setTypedAnswer(e.target.value)}
                        maxLength={200}
                        autoComplete="off"
                        disabled={selectedAnswer !== null}
                        className="w-full min-h-11 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-400"
                      />
                      <button type="submit" disabled={selectedAnswer !== null || !typedAnswer.trim()} className="w-full min-h-11 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-sm text-white font-bold transition disabled:opacity-60">
                        Gửi câu trả lời
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Phase: Result */}
              {phase === 'result' && feedback && (
                <div className="space-y-3">
                  <div role="status" className={`p-3 rounded-xl border text-xs font-semibold ${feedback.isCorrect ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-rose-950/40 border-rose-800 text-rose-300'}`}>
                    {feedback.isCorrect
                      ? `✅ Chính xác! Em đã sửa thành công! +${feedback.xpAwarded} XP`
                      : '❌ Chưa đúng rồi, hãy đọc lại giải thích rồi thử lại nhé!'}
                  </div>

                  {!feedback.isCorrect && (
                    <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                      <p className="text-xs text-slate-300">{feedback.explanation}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!feedback.isCorrect && (
                      <button type="button" onClick={goToRetry} className="flex-1 min-h-11 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-sm text-white font-bold">
                        Thử lại
                      </button>
                    )}
                    {selectedIdx < items.length - 1 && (
                      <button type="button" onClick={() => selectItem(selectedIdx + 1)} className="flex-1 min-h-11 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm text-white">
                        Câu tiếp →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : !loading ? (
            <div className="w-full md:w-2/3 flex items-center justify-center p-8">
              <div className="text-center space-y-2">
                <Wrench className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-500">Chọn câu cần ôn bên trái</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </DialogFrame>
  );
};
