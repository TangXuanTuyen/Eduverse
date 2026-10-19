'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Khung hộp thoại dùng chung: role="dialog", aria-modal, giữ focus bên trong,
 * Esc để đóng và trả focus về phần tử trước đó khi đóng.
 * Hỗ trợ hộp thoại lồng nhau: chỉ hộp thoại trên cùng nhận phím Esc/Tab.
 */

const dialogStack: symbol[] = [];

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

interface DialogFrameProps {
  /** Gọi khi nhấn Esc. Bỏ trống nếu hộp thoại không được phép đóng (ví dụ tạo nhân vật lần đầu). */
  onClose?: () => void;
  labelledBy?: string;
  label?: string;
  className?: string;
  children: React.ReactNode;
}

export function DialogFrame({ onClose, labelledBy, label, className, children }: DialogFrameProps) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const id = Symbol('dialog');
    dialogStack.push(id);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    node.focus({ preventScroll: true });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (dialogStack[dialogStack.length - 1] !== id) return;

      if (e.key === 'Escape') {
        if (onCloseRef.current) {
          e.preventDefault();
          onCloseRef.current();
        }
        return;
      }

      if (e.key !== 'Tab') return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0
      );
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === node || !node.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !node.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const idx = dialogStack.indexOf(id);
      if (idx >= 0) dialogStack.splice(idx, 1);
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      tabIndex={-1}
      className={`outline-none ${className ?? ''}`}
    >
      {children}
    </div>
  );
}
