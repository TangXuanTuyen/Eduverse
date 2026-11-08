'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Khung nhúng thí nghiệm/mô phỏng luôn vừa đúng 1 màn hình.
 * Giữ nguyên giao diện bên trong; nếu nội dung cao/rộng hơn khung thì thu nhỏ
 * (CSS scale) để không phải cuộn. Chỉ đo được khi cùng nguồn gốc (same-origin);
 * khác nguồn thì hiển thị bình thường.
 */

const MIN_SCALE = 0.45;

interface FitFrameProps {
  src: string;
  title: string;
  allow?: string;
  sandbox?: string;
  className?: string;
}

export function FitFrame({ src, title, allow, sandbox, className }: FitFrameProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);
  const timers = useRef<number[]>([]);

  // Theo dõi kích thước khung chứa
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Đo nội dung bên trong và thu nhỏ nếu tràn
  const measure = useCallback(() => {
    const f = frameRef.current;
    if (!f || !size.w || !size.h) return;
    try {
      const doc = f.contentDocument?.documentElement;
      if (!doc) return;
      const sh = doc.scrollHeight;
      const sw = doc.scrollWidth;
      const ch = f.clientHeight;
      const cw = f.clientWidth;
      if (sh > ch + 2 || sw > cw + 2) {
        const ratio = Math.min(ch / sh, cw / sw);
        setScale((s) => Math.max(MIN_SCALE, Math.min(1, s * ratio)));
      }
    } catch {
      /* khác nguồn gốc: bỏ qua */
    }
  }, [size.w, size.h]);

  const schedule = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [500, 1500, 3500].map((ms) => window.setTimeout(measure, ms));
  }, [measure]);

  // Đổi kích thước khung → đo lại từ đầu
  useEffect(() => {
    setScale(1);
    schedule();
    return () => timers.current.forEach((t) => window.clearTimeout(t));
  }, [size.w, size.h, src, schedule]);

  // Sau mỗi lần thu nhỏ, đo lại một lần để chỉnh cho khít
  useEffect(() => {
    if (scale >= 1) return;
    const t = window.setTimeout(measure, 400);
    return () => window.clearTimeout(t);
  }, [scale, measure]);

  return (
    <div ref={boxRef} className={`relative overflow-hidden ${className ?? 'flex-1 min-h-0 w-full'}`}>
      <iframe
        ref={frameRef}
        src={src}
        title={title}
        allow={allow}
        sandbox={sandbox}
        onLoad={schedule}
        className="absolute left-0 top-0 border-0"
        style={{
          width: size.w ? size.w / scale : '100%',
          height: size.h ? size.h / scale : '100%',
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top left',
        }}
      />
    </div>
  );
}
