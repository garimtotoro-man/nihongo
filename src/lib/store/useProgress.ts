'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LocalProgressStore } from './local';
import { defaultProgress, emptyDay, RECENT_LIMIT, type Progress, type ProgressStore } from './types';
import { dayKey } from '@/lib/streak';

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/**
 * 화면은 이 훅만 쓴다. 어느 저장소(로컬·서버)인지 모르게 한다.
 * ready 가 false 인 동안은 기본값이며, 마운트 뒤 저장소에서 읽어 채운다(서버 렌더와 어긋나지 않게).
 */
export function useProgress(store?: ProgressStore) {
  const storeRef = useRef<ProgressStore | null>(store ?? null);
  const [progress, setProgress] = useState<Progress>(defaultProgress);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!storeRef.current) storeRef.current = new LocalProgressStore();
    let alive = true;
    storeRef.current.load().then((p) => {
      if (!alive) return;
      setProgress(p);
      setReady(true);
    });
    return () => { alive = false; };
  }, []);

  const update = useCallback((fn: (p: Progress) => Progress) => {
    setProgress((prev) => {
      const next = fn(prev);
      void storeRef.current?.save(next);
      return next;
    });
  }, []);

  const actions = useMemo(() => ({
    toggleLike: (id: string) => update((p) => ({ ...p, liked: toggle(p.liked, id) })),
    toggleSave: (id: string) => update((p) => ({ ...p, saved: toggle(p.saved, id) })),
    markSeen: (id: string) => update((p) => {
      const day = dayKey();
      const d = p.daily[day] ?? emptyDay();
      const recent = [id, ...p.recent.filter((x) => x !== id)].slice(0, RECENT_LIMIT);
      return {
        ...p,
        seen: { ...p.seen, [id]: (p.seen[id] ?? 0) + 1 },
        recent,
        daily: { ...p.daily, [day]: { ...d, seen: d.seen + 1 } },
      };
    }),
    markRevealed: () => update((p) => {
      const day = dayKey();
      const d = p.daily[day] ?? emptyDay();
      return { ...p, daily: { ...p.daily, [day]: { ...d, revealed: d.revealed + 1 } } };
    }),
    setLevel: (level: Progress['level']) => update((p) => ({ ...p, level })),
    setActivePacks: (activePacks: Progress['activePacks']) => update((p) => ({ ...p, activePacks })),
    setSettings: (s: Partial<Progress['settings']>) => update((p) => ({ ...p, settings: { ...p.settings, ...s } })),
  }), [update]);

  return { progress, ready, update, ...actions };
}
