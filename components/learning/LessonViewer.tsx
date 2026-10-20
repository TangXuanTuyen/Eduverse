'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle, Lightbulb, Search, ClipboardCheck, FileText } from 'lucide-react';
import type { LessonContent, ContentBlock } from '@/lib/lessons/schema';
import { Model3DViewer } from './Model3DViewer';
import { PhetSimViewer } from './PhetSimViewer';
import { ObservationSheet } from './ObservationSheet';
import type { Model3DBlock, PhetSimBlock, ObservationBlock, QuestionBlock } from '@/lib/lessons/schema';

const PHASE_ICONS: Record<string, typeof BookOpen> = {
  khoi_dong: Lightbulb,
  kham_pha: Search,
  giai_thich: BookOpen,
  kiem_tra: ClipboardCheck,
  tom_tat: FileText,
};
const PHASE_LABELS: Record<string, string> = {
  khoi_dong: 'Khởi động',
  kham_pha: 'Khám phá',
  giai_thich: 'Giải thích',
  kiem_tra: 'Kiểm tra nhanh',
  tom_tat: 'Tóm tắt',
};

type Props = {
  lessonId: string;
  title: string;
  content: LessonContent;
  initialStep?: number;
  completedSteps?: number[];
  notes?: Record<number, { prediction: string; observation: string; explanation: string }>;
  recommendation?: string;
};

export function LessonViewer({ lessonId, title, content, initialStep = 0, completedSteps = [], notes = {}, recommendation }: Props) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completed, setCompleted] = useState<Set<number>>(new Set(completedSteps));
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResults, setQuizResults] = useState<Record<string, { correct: boolean; explanation?: string }>>({});

  const step = content[currentStep];
  if (!step) return <p className="text-slate-400 text-center py-8">Bài học trống</p>;

  const PhaseIcon = PHASE_ICONS[step.phase] ?? BookOpen;

  const markStepComplete = useCallback(async (stepIdx: number) => {
    setCompleted((prev) => new Set(prev).add(stepIdx));
    try {
      await fetch('/api/lessons/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, currentStep: stepIdx, completedStep: stepIdx }),
      });
    } catch { /* ignore */ }
  }, [lessonId]);

  const handleSaveNote = useCallback(async (data: { prediction: string; observation: string; explanation: string }) => {
    try {
      await fetch('/api/lessons/observation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, stepIndex: currentStep, ...data }),
      });
    } catch { /* ignore */ }
  }, [lessonId, currentStep]);

  const handleQuizSubmit = useCallback(async (blockIdx: number, block: QuestionBlock, answer: string) => {
    const key = `${currentStep}-${blockIdx}`;
    setQuizAnswers((prev) => ({ ...prev, [key]: answer }));
    try {
      const res = await fetch('/api/lessons/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, stepIndex: currentStep, blockIndex: blockIdx, answer }),
      });
      const data = await res.json();
      setQuizResults((prev) => ({ ...prev, [key]: { correct: data.correct, explanation: data.explanation } }));
    } catch { /* ignore */ }
  }, [lessonId, currentStep]);

  const recordEvent = useCallback(async (eventType: string, data?: Record<string, unknown>) => {
    try {
      await fetch('/api/lessons/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, stepIndex: currentStep, eventType, data }),
      });
    } catch { /* ignore */ }
  }, [lessonId, currentStep]);

  useEffect(() => {
    recordEvent('step_view');
  }, [currentStep, recordEvent]);

  function goNext() {
    markStepComplete(currentStep);
    if (currentStep < content.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }

  function goPrev() {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  }

  function renderBlock(block: ContentBlock, blockIdx: number) {
    switch (block.type) {
      case 'text':
        return <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{block.content}</div>;
      case 'image':
        return (
          <figure className="space-y-1">
            <img src={block.src} alt={block.alt} className="w-full rounded-lg" loading="lazy" />
            {block.caption && <figcaption className="text-xs text-slate-400 text-center">{block.caption}</figcaption>}
            {block.credit && <p className="text-[10px] text-slate-500 text-center">Nguồn: {block.credit}</p>}
          </figure>
        );
      case 'model3d':
        return (
          <Model3DViewer
            block={block as Model3DBlock}
            onInteract={() => recordEvent('model_interact')}
          />
        );
      case 'phet_sim':
        return (
          <PhetSimViewer
            block={block as PhetSimBlock}
            onStart={() => recordEvent('sim_start')}
            onComplete={() => recordEvent('sim_complete')}
          />
        );
      case 'observation':
        return (
          <ObservationSheet
            block={block as ObservationBlock}
            lessonId={lessonId}
            stepIndex={currentStep}
            initial={notes[currentStep]}
            onSave={handleSaveNote}
          />
        );
      case 'question': {
        const qBlock = block as QuestionBlock;
        const key = `${currentStep}-${blockIdx}`;
        const answered = key in quizResults;
        const result = quizResults[key];
        return (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <p className="text-sm text-white font-medium">{qBlock.content}</p>
            {qBlock.options && (
              <div className="space-y-2">
                {qBlock.options.map((o) => {
                  const selected = quizAnswers[key] === o.id;
                  let cls = 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white';
                  if (answered && selected) {
                    cls = result?.correct
                      ? 'bg-green-900 border-green-500 text-green-200'
                      : 'bg-red-900 border-red-500 text-red-200';
                  }
                  return (
                    <button
                      key={o.id}
                      onClick={() => !answered && handleQuizSubmit(blockIdx, qBlock, o.id)}
                      disabled={answered}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm min-h-[44px] ${cls}`}
                    >
                      <span className="font-mono mr-2 opacity-60">{o.id.toUpperCase()}.</span>
                      {o.text}
                    </button>
                  );
                })}
              </div>
            )}
            {answered && result && (
              <div className={`text-xs p-2 rounded-lg ${result.correct ? 'bg-green-950/50 text-green-300' : 'bg-red-950/50 text-red-300'}`}>
                {result.correct ? '✓ Đúng!' : '✗ Chưa đúng.'} {result.explanation}
              </div>
            )}
          </div>
        );
      }
      case 'drag_drop':
        return (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-sm text-slate-400 text-center">
              Bài tập kéo-thả: {block.title}
            </p>
            <p className="text-xs text-slate-500 text-center mt-1">(Tính năng sẽ có trong phiên bản tiếp theo)</p>
          </div>
        );
      case 'virtual_lab':
        return (
          <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-4 space-y-2">
            <p className="text-sm text-purple-300 font-medium">{block.title}</p>
            {block.safetyRules && block.safetyRules.length > 0 && (
              <div className="text-xs text-amber-300 space-y-0.5">
                <p className="font-medium">⚠ Quy tắc an toàn:</p>
                {block.safetyRules.map((r, i) => <p key={i}>• {r}</p>)}
              </div>
            )}
            <p className="text-xs text-slate-500 text-center">(Phòng thí nghiệm ảo — sẽ mở rộng sau)</p>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-lg font-bold text-white">{title}</h1>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{currentStep + 1}/{content.length}</span>
          <span className="text-slate-600">•</span>
          {content.map((s, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${
                i === currentStep
                  ? 'bg-cyan-600 text-white'
                  : completed.has(i)
                    ? 'bg-green-600/40 text-green-300'
                    : 'bg-slate-800 text-slate-500'
              }`}
              aria-label={`Bước ${i + 1}: ${PHASE_LABELS[s.phase]}`}
            >
              {completed.has(i) ? '✓' : i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Step header */}
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
        <PhaseIcon size={18} className="text-cyan-400" />
        <div>
          <p className="text-xs text-cyan-400 font-medium">{PHASE_LABELS[step.phase]}</p>
          <p className="text-sm text-white font-bold">{step.title}</p>
        </div>
      </div>

      {/* Blocks */}
      <div className="space-y-4">
        {step.blocks.map((block, i) => (
          <div key={i}>{renderBlock(block, i)}</div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={goPrev}
          disabled={currentStep === 0}
          className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-sm text-white flex items-center gap-1.5 min-h-[44px] disabled:opacity-30"
        >
          <ChevronLeft size={16} /> Trước
        </button>

        {currentStep < content.length - 1 ? (
          <button
            onClick={goNext}
            className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2.5 text-sm font-medium text-white flex items-center gap-1.5 min-h-[44px]"
          >
            Tiếp <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={() => {
              markStepComplete(currentStep);
              recordEvent('lesson_complete');
              fetch('/api/lessons/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonId, isCompleted: true }),
              });
            }}
            className="rounded-lg bg-green-600 hover:bg-green-500 px-4 py-2.5 text-sm font-medium text-white flex items-center gap-1.5 min-h-[44px]"
          >
            <CheckCircle size={16} /> Hoàn thành bài học
          </button>
        )}
      </div>

      {/* Recommendation */}
      {recommendation && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center text-xs text-slate-400">
          {recommendation === 'expand' && '🌟 Bạn làm tốt lắm! Có thể thử bài nâng cao.'}
          {recommendation === 'review' && '📖 Nên ôn lại bài này trước khi học tiếp.'}
          {recommendation === 'learn_next' && '➡️ Sẵn sàng học bài tiếp theo!'}
        </div>
      )}
    </div>
  );
}
