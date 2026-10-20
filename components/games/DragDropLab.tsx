'use client';

import { useState, useRef } from 'react';
import { FlaskConical, GripVertical, ArrowRight } from 'lucide-react';

type OrderingQuestion = {
  id: string;
  sourceQuestionId: string;
  content: string;
  type: 'ordering';
  options: { items: string[] };
};

type MatchingQuestion = {
  id: string;
  sourceQuestionId: string;
  content: string;
  type: 'matching';
  options: { left: string[]; right: string[] };
};

type ClassificationQuestion = {
  id: string;
  sourceQuestionId: string;
  content: string;
  type: 'classification';
  options: { items: string[]; categories: string[] };
};

type DragQuestion = OrderingQuestion | MatchingQuestion | ClassificationQuestion;

// Ordering: drag to reorder
function OrderingGame({
  question,
  onSubmit,
}: {
  question: OrderingQuestion;
  onSubmit: (answer: string[]) => void;
}) {
  const [items, setItems] = useState(() =>
    [...question.options.items].sort(() => Math.random() - 0.5),
  );
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragStart = (idx: number) => { dragItem.current = idx; };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    dragOverItem.current = idx;
  };
  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const newItems = [...items];
    const [dragged] = newItems.splice(dragItem.current, 1);
    newItems.splice(dragOverItem.current, 0, dragged);
    setItems(newItems);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // Touch support: move by buttons
  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const newItems = [...items];
    [newItems[idx - 1], newItems[idx]] = [newItems[idx], newItems[idx - 1]];
    setItems(newItems);
  };
  const moveDown = (idx: number) => {
    if (idx === items.length - 1) return;
    const newItems = [...items];
    [newItems[idx], newItems[idx + 1]] = [newItems[idx + 1], newItems[idx]];
    setItems(newItems);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-white font-medium">{question.content}</p>
      <p className="text-xs text-slate-400">Kéo hoặc dùng nút ▲▼ để sắp xếp đúng thứ tự:</p>
      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <div
            key={`${item}-${idx}`}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={handleDrop}
            className="flex items-center gap-2 p-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-cyan-500/50 cursor-grab active:cursor-grabbing transition"
          >
            <GripVertical className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-xs text-cyan-400 font-bold w-5">{idx + 1}.</span>
            <span className="text-sm text-slate-200 flex-1">{item}</span>
            <div className="flex flex-col gap-0.5">
              <button onClick={() => moveUp(idx)} className="text-[10px] text-slate-500 hover:text-white px-1 min-h-[24px]" aria-label="Di chuyển lên">▲</button>
              <button onClick={() => moveDown(idx)} className="text-[10px] text-slate-500 hover:text-white px-1 min-h-[24px]" aria-label="Di chuyển xuống">▼</button>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => onSubmit(items)}
        className="w-full min-h-[44px] rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm text-white font-bold"
      >
        Kiểm tra
      </button>
    </div>
  );
}

// Matching: connect left to right
function MatchingGame({
  question,
  onSubmit,
}: {
  question: MatchingQuestion;
  onSubmit: (answer: Record<string, string>) => void;
}) {
  const { left, right } = question.options;
  const [shuffledRight] = useState(() => [...right].sort(() => Math.random() - 0.5));
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  const handleLeftClick = (item: string) => setSelectedLeft(item);
  const handleRightClick = (item: string) => {
    if (!selectedLeft) return;
    setMatches((prev) => ({ ...prev, [selectedLeft]: item }));
    setSelectedLeft(null);
  };

  const allMatched = Object.keys(matches).length === left.length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-white font-medium">{question.content}</p>
      <p className="text-xs text-slate-400">Chọn 1 bên trái, rồi chọn 1 bên phải để nối:</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          {left.map((item) => (
            <button
              key={item}
              onClick={() => handleLeftClick(item)}
              className={`w-full text-left p-2.5 rounded-lg border text-xs transition min-h-[44px] ${
                selectedLeft === item
                  ? 'bg-cyan-600/30 border-cyan-400 text-cyan-200'
                  : matches[item]
                    ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-200 hover:border-cyan-500/50'
              }`}
            >
              {item}
              {matches[item] && <span className="text-[10px] block text-emerald-400 mt-0.5">→ {matches[item]}</span>}
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          {shuffledRight.map((item) => {
            const matched = Object.values(matches).includes(item);
            return (
              <button
                key={item}
                onClick={() => handleRightClick(item)}
                disabled={!selectedLeft}
                className={`w-full text-left p-2.5 rounded-lg border text-xs transition min-h-[44px] ${
                  matched
                    ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300 opacity-60'
                    : selectedLeft
                      ? 'bg-slate-800 border-slate-700 text-slate-200 hover:border-amber-500/50 cursor-pointer'
                      : 'bg-slate-800 border-slate-700 text-slate-300 opacity-50'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>
      {allMatched && (
        <button
          onClick={() => onSubmit(matches)}
          className="w-full min-h-[44px] rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm text-white font-bold"
        >
          Kiểm tra
        </button>
      )}
    </div>
  );
}

// Classification: drag items into categories
function ClassificationGame({
  question,
  onSubmit,
}: {
  question: ClassificationQuestion;
  onSubmit: (answer: Record<string, string[]>) => void;
}) {
  const { items: allItems, categories } = question.options;
  const [unplaced, setUnplaced] = useState(() => [...allItems].sort(() => Math.random() - 0.5));
  const [buckets, setBuckets] = useState<Record<string, string[]>>(
    Object.fromEntries(categories.map((c) => [c, []])),
  );

  const placeItem = (item: string, category: string) => {
    setUnplaced((prev) => prev.filter((i) => i !== item));
    setBuckets((prev) => ({
      ...prev,
      [category]: [...prev[category], item],
    }));
  };

  const removeItem = (item: string, category: string) => {
    setBuckets((prev) => ({
      ...prev,
      [category]: prev[category].filter((i) => i !== item),
    }));
    setUnplaced((prev) => [...prev, item]);
  };

  const allPlaced = unplaced.length === 0;
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <p className="text-sm text-white font-medium">{question.content}</p>
      <p className="text-xs text-slate-400">Chọn 1 mục, rồi chọn nhóm để phân loại:</p>

      {/* Unplaced items */}
      {unplaced.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {unplaced.map((item) => (
            <button
              key={item}
              onClick={() => setSelectedItem(selectedItem === item ? null : item)}
              className={`px-3 py-1.5 rounded-lg border text-xs transition min-h-[36px] ${
                selectedItem === item
                  ? 'bg-amber-600/30 border-amber-400 text-amber-200'
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:border-amber-500/50'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {/* Category buckets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {categories.map((cat) => (
          <div
            key={cat}
            onClick={() => {
              if (selectedItem) {
                placeItem(selectedItem, cat);
                setSelectedItem(null);
              }
            }}
            className={`p-3 rounded-xl border min-h-[80px] transition ${
              selectedItem
                ? 'border-amber-500/50 bg-amber-500/5 cursor-pointer hover:bg-amber-500/10'
                : 'border-slate-700 bg-slate-800/50'
            }`}
          >
            <div className="text-xs font-bold text-cyan-400 mb-2">{cat}</div>
            <div className="flex flex-wrap gap-1">
              {buckets[cat].map((item) => (
                <button
                  key={item}
                  onClick={(e) => { e.stopPropagation(); removeItem(item, cat); }}
                  className="px-2 py-1 rounded bg-slate-700 text-[10px] text-slate-200 hover:bg-red-900/50 hover:text-red-300 transition"
                  title="Nhấn để gỡ"
                >
                  {item} ✕
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {allPlaced && (
        <button
          onClick={() => onSubmit(buckets)}
          className="w-full min-h-[44px] rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm text-white font-bold"
        >
          Kiểm tra
        </button>
      )}
    </div>
  );
}

// Main wrapper
export function DragDropLab({
  questions,
  onComplete,
  onClose,
}: {
  questions: DragQuestion[];
  onComplete: (results: Array<{ isCorrect: boolean }>) => void;
  onClose: () => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<Array<{ isCorrect: boolean; explanation: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<{ isCorrect: boolean; explanation: string } | null>(null);

  const q = questions[currentIdx];
  const finished = currentIdx >= questions.length || (!q && results.length > 0);

  const handleSubmit = async (answer: unknown) => {
    if (!q || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/game/boss/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceQuestionId: q.sourceQuestionId, answer }),
      });
      const data = await res.json();
      const fb = { isCorrect: data.isCorrect, explanation: data.explanation || '' };
      setResults((prev) => [...prev, fb]);
      setLastFeedback(fb);
    } catch {
      setLastFeedback({ isCorrect: false, explanation: 'Lỗi kết nối' });
    }
    setSubmitting(false);
  };

  const nextQuestion = () => {
    setLastFeedback(null);
    setCurrentIdx((i) => i + 1);
  };

  if (finished) {
    const correct = results.filter((r) => r.isCorrect).length;
    return (
      <div className="space-y-4 text-center">
        <FlaskConical className="w-10 h-10 text-cyan-400 mx-auto" />
        <div className="text-lg font-bold text-white">{correct}/{results.length} đúng</div>
        <div className="flex gap-2 justify-center pt-2">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm text-white min-h-[44px]">
            Đóng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-bold text-white">Phòng TN ghép</span>
        </div>
        <span className="text-xs text-slate-400">{currentIdx + 1}/{questions.length}</span>
      </div>

      {lastFeedback ? (
        <div className="space-y-3">
          <div className={`p-3 rounded-xl border text-xs font-semibold ${
            lastFeedback.isCorrect
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800 text-rose-300'
          }`}>
            {lastFeedback.isCorrect ? '✅ Chính xác!' : '❌ Chưa đúng'}
            {lastFeedback.explanation && !lastFeedback.isCorrect && (
              <p className="mt-1 font-normal text-slate-400">{lastFeedback.explanation}</p>
            )}
          </div>
          <button onClick={nextQuestion} className="w-full min-h-[44px] rounded-xl bg-slate-700 hover:bg-slate-600 text-sm text-white flex items-center justify-center gap-1">
            Tiếp <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : q?.type === 'ordering' ? (
        <OrderingGame question={q as OrderingQuestion} onSubmit={handleSubmit} />
      ) : q?.type === 'matching' ? (
        <MatchingGame question={q as MatchingQuestion} onSubmit={handleSubmit} />
      ) : q?.type === 'classification' ? (
        <ClassificationGame question={q as ClassificationQuestion} onSubmit={handleSubmit} />
      ) : null}
    </div>
  );
}
