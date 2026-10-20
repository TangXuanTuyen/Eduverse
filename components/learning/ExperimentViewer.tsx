'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, Clock, ArrowLeft, BookOpen } from 'lucide-react';

type ExperimentDetail = {
  experiment: {
    id: string;
    title: string;
    description: string;
    embed_url: string | null;
    component_key: string | null;
    duration_minutes: number;
  };
  steps: { id: string; step_number: number; title: string; instruction: string; image_url: string | null }[];
};

type Props = {
  experimentId: string;
  onClose: () => void;
  onComplete?: () => void;
};

export function ExperimentViewer({ experimentId, onClose, onComplete }: Props) {
  const [detail, setDetail] = useState<ExperimentDetail | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showSteps, setShowSteps] = useState(true);

  useEffect(() => {
    fetch(`/api/experiments/${experimentId}`)
      .then((r) => r.json())
      .then((d) => setDetail(d))
      .catch(() => {});

    fetch('/api/labs/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experimentId }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.submissionId) setSubmissionId(d.submissionId);
        if (d.status === 'completed') setCompleted(true);
      })
      .catch(() => {});
  }, [experimentId]);

  const handleComplete = useCallback(async () => {
    if (!submissionId || completed) return;
    try {
      await fetch('/api/labs/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      });
      setCompleted(true);
      onComplete?.();
    } catch {
      // ignore
    }
  }, [submissionId, completed, onComplete]);

  if (!detail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90">
        <div className="text-white animate-pulse">Đang tải thí nghiệm...</div>
      </div>
    );
  }

  const { experiment, steps } = detail;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="text-white font-bold text-sm truncate">{experiment.title}</h1>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock size={12} /> {experiment.duration_minutes} phút
              {completed && <span className="text-green-400 flex items-center gap-1"><CheckCircle size={12} /> Đã hoàn thành</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {steps.length > 0 && (
            <button
              onClick={() => setShowSteps(!showSteps)}
              className="min-h-[44px] px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5"
            >
              <BookOpen size={14} /> Hướng dẫn
            </button>
          )}
          {!completed && submissionId && (
            <button
              onClick={handleComplete}
              className="min-h-[44px] px-4 rounded-lg bg-green-600 hover:bg-green-500 text-sm font-medium text-white"
            >
              Hoàn thành
            </button>
          )}
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Iframe or built-in */}
        <div className="flex-1 relative">
          {experiment.embed_url ? (
            <iframe
              src={experiment.embed_url}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              title={experiment.title}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              <p className="text-sm">Thí nghiệm built-in: {experiment.component_key}</p>
            </div>
          )}
        </div>

        {/* Steps panel */}
        {showSteps && steps.length > 0 && (
          <div className="w-72 shrink-0 bg-slate-900 border-l border-slate-800 overflow-y-auto p-4 space-y-3">
            <h3 className="text-sm font-bold text-white">Các bước thực hiện</h3>
            {steps.map((step, i) => (
              <div
                key={step.id}
                className={`p-3 rounded-lg border cursor-pointer transition ${
                  i === currentStep
                    ? 'bg-cyan-900/20 border-cyan-500/30'
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                }`}
                onClick={() => setCurrentStep(i)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-slate-700 text-[10px] text-white flex items-center justify-center font-bold">
                    {step.step_number}
                  </span>
                  <span className="text-xs font-medium text-white">{step.title}</span>
                </div>
                {i === currentStep && (
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.instruction}</p>
                )}
                {i === currentStep && step.image_url && (
                  <img src={step.image_url} alt="" className="mt-2 rounded w-full" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
