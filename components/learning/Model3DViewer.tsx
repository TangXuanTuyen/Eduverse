'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, Eye, EyeOff, Layers, HelpCircle } from 'lucide-react';
import type { Model3DBlock } from '@/lib/lessons/schema';

type Props = {
  block: Model3DBlock;
  onInteract?: () => void;
};

export function Model3DViewer({ block, onInteract }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [webglOk, setWebglOk] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [quizMode, setQuizMode] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setWebglOk(false);
    } catch {
      setWebglOk(false);
    }
  }, []);

  const loadModelViewer = useCallback(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    import('@google/model-viewer')
      .then(() => setLoaded(true))
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    if (!webglOk) return;
    const el = containerRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { loadModelViewer(); obs.disconnect(); } },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [webglOk, loadModelViewer]);

  if (!webglOk || error) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-amber-400 text-sm">
          <AlertTriangle size={16} />
          <span>Không hỗ trợ mô hình 3D trên thiết bị này</span>
        </div>
        {(block.fallbackImage || block.poster) && (
          <img
            src={block.fallbackImage || block.poster}
            alt={block.alt}
            className="w-full rounded-lg"
          />
        )}
        {block.fallbackCaption && (
          <p className="text-xs text-slate-400">{block.fallbackCaption}</p>
        )}
        <p className="text-[10px] text-slate-500">Nguồn: {block.credit}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {loaded ? (
        <>
          {/* @ts-expect-error model-viewer is a custom element */}
          <model-viewer
            src={block.src}
            poster={block.poster}
            alt={block.alt}
            camera-controls
            touch-action="pan-y"
            reveal="interaction"
            style={{ width: '100%', height: '300px', background: '#0f172a' }}
            onLoad={() => onInteract?.()}
            onError={() => setError(true)}
          >
            {block.hotspots?.map((h, i) => (
              <button
                key={i}
                slot={`hotspot-${i}`}
                data-position={h.position}
                data-normal={h.normal}
                className={`min-w-[28px] min-h-[28px] rounded-full text-[10px] font-bold border-2 transition ${
                  quizMode
                    ? 'bg-amber-600 border-amber-400 text-white'
                    : 'bg-cyan-600 border-cyan-400 text-white'
                }`}
                aria-label={quizMode ? `Hotspot ${i + 1}` : h.label}
                title={quizMode ? '?' : `${h.label}${h.description ? ` — ${h.description}` : ''}`}
              >
                {quizMode ? '?' : (showLabels ? h.label.slice(0, 3) : (i + 1))}
              </button>
            ))}
          {/* @ts-expect-error model-viewer closing tag */}
          </model-viewer>

          <div className="px-3 py-2 flex items-center justify-between border-t border-slate-800">
            <div className="flex gap-1.5">
              {block.hotspots && block.hotspots.length > 0 && (
                <>
                  <button
                    onClick={() => setShowLabels(!showLabels)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-slate-800 text-slate-300 hover:text-white min-h-[32px]"
                    aria-label={showLabels ? 'Ẩn nhãn' : 'Hiện nhãn'}
                  >
                    {showLabels ? <EyeOff size={12} /> : <Eye size={12} />}
                    {showLabels ? 'Ẩn nhãn' : 'Nhãn'}
                  </button>
                  <button
                    onClick={() => setQuizMode(!quizMode)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] min-h-[32px] ${
                      quizMode ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                    aria-label={quizMode ? 'Tắt tự kiểm tra' : 'Tự kiểm tra'}
                  >
                    <HelpCircle size={12} />
                    {quizMode ? 'Đang kiểm tra' : 'Tự kiểm tra'}
                  </button>
                </>
              )}
            </div>
            <p className="text-[10px] text-slate-500">Nguồn: {block.credit}</p>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-center space-y-2">
            <Layers className="w-8 h-8 mx-auto text-slate-500 animate-pulse" />
            <p className="text-xs text-slate-400">Đang tải mô hình 3D...</p>
          </div>
        </div>
      )}
    </div>
  );
}
