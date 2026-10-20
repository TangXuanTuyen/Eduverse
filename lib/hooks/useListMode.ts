'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'eduverse_list_mode';

export function useListMode() {
  const [listMode, setListMode] = useState(false);

  useEffect(() => {
    try {
      setListMode(localStorage.getItem(STORAGE_KEY) === '1');
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    setListMode((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0'); } catch {}
      return next;
    });
  }, []);

  return { listMode, toggleListMode: toggle };
}
