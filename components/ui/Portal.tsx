'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Đưa nội dung ra thẳng document.body. Dùng cho lớp phủ toàn màn hình (fixed)
 * nằm trong hộp thoại: hộp thoại có backdrop-blur và overflow-hidden sẽ làm
 * lớp phủ bị cắt hoặc lệch vị trí.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}
