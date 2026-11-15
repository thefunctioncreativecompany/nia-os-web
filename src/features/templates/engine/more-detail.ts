'use client';

import { useCallback, useSyncExternalStore } from 'react';

// More detail (Ika, 2026-11-15: "less overwhelming for beginners and experienced teams"): a template's
// detail columns (a shot list's angle, move, framing…) wait until it's on. It's remembered per
// template on this device, so an experienced team turns it on once. Until someone chooses, it
// starts on when the document already has detail answers, and off otherwise.

const EVENT = 'nia-more-detail';
const keyFor = (code: string) => `nia:more-detail:${code}`;

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export function useMoreDetail(code: string, startOn: boolean) {
  const key = keyFor(code);
  const stored = useSyncExternalStore(subscribe, () => read(key), () => null);
  const on = stored === null ? startOn : stored === 'on';
  const set = useCallback(
    (next: boolean) => {
      try {
        localStorage.setItem(key, next ? 'on' : 'off');
      } catch {}
      window.dispatchEvent(new Event(EVENT));
    },
    [key],
  );
  return [on, set] as const;
}
