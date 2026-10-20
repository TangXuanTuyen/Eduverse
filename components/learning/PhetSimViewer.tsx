'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, AlertTriangle, ExternalLink } from 'lucide-react';
import type { PhetSimBlock } from '@/lib/lessons/schema';

type Props = {
  block: PhetSimBlock;
  onStart?: () => void;
  onComplete?: () => void;
};

const PHET_BASE = 'https://phet.colorado.edu/sims/html';

export function PhetSimViewer({ block, onStart, onComplete }: Props) {
  const [started, setStarted] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleStart() {
    setStarted(true);
    onStart?.();

    // Try local first, then online
    const localPath = block.localPath || `/phet/${block.simName}_all.html`;
    const onlineUrl = `${PHET_BASE}/${block.simName}/latest/${block.simName}_all.html`;

    setSrc(localPath);

    // Timeout: if local doesn't load in 8s, try online
    timeoutRef.current = setTimeout(() => {
      setSrc(onlineUrl);
      // Second timeout for online
      timeoutRef.current = setTimeout(() => {
        setTimedOut(true);
      }, 15000);
    }, 8000);
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleLoad() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }

  function handleError() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (src?.startsWith('/phet/')) {
      // Local failed, try online
      const onlineUrl = `${PHET_BASE}/${block.simName}/latest/${block.simName}_all.html`;
      setSrc(onlineUrl);
      timeoutRef.current = setTimeout(() => setTimedOut(true), 15000);
    } else {
      setError(true);
    }
  }

  if (!started) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {block.fallbackImage && (
          <img src={block.fallbackImage} alt={`Mô phỏng ${block.simName}`} className="w-full h-48 object-cover" />
        )}
        <div className="p-4 space-y-3">
          <button
            onClick={handleStart}
            className="w-full rounded-lg bg-green-600 hover:bg-green-500 px-4 py-3 text-sm font-medium text-white flex items-center justify-center gap-2 min-h-[48px]"
          >
            <Play size={18} /> Bắt đầu mô phỏng
          </button>
          <p className="text-[10px] text-slate-500 text-center">
            PhET Interactive Simulations, University of Colorado Boulder
          </p>
        </div>
      </div>
    );
  }

  if (error || timedOut) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 text-sm">
          <AlertTriangle size={16} />
          <span>Không tải được mô phỏng</span>
        </div>
        {block.fallbackImage && (
          <img src={block.fallbackImage} alt="" className="w-full rounded-lg" />
        )}
        {block.fallbackGuide && (
          <p className="text-xs text-slate-400">{block.fallbackGuide}</p>
        )}
        <a
          href={`${PHET_BASE}/${block.simName}/latest/${block.simName}_all.html`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline"
        >
          Mở trên trang PhET <ExternalLink size={12} />
        </a>
        <p className="text-[10px] text-slate-500">
          PhET Interactive Simulations, University of Colorado Boulder
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {src && (
        <iframe
          ref={iframeRef}
          src={src}
          className="w-full border-0"
          style={{ height: '450px' }}
          sandbox="allow-scripts allow-same-origin"
          title={`Mô phỏng PhET: ${block.simName}`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      <div className="px-3 py-2 border-t border-slate-800 flex items-center justify-between">
        <p className="text-[10px] text-slate-500">
          PhET Interactive Simulations, University of Colorado Boulder
        </p>
        <button
          onClick={() => onComplete?.()}
          className="text-[10px] text-green-400 hover:underline"
        >
          Hoàn thành mô phỏng
        </button>
      </div>
    </div>
  );
}
