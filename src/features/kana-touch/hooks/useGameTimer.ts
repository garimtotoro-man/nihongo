'use client';

import { useEffect, useRef, useState } from 'react';

/** requestAnimationFrame 으로 흐르는 경과 시간(ms). playing 일 때만 돈다. */
export function useGameTimer(startedAt: number | null, running: boolean, frozenAt: number | null): number {
  const [elapsed, setElapsed] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (startedAt === null) {
      setElapsed(0);
      return;
    }
    if (!running) {
      setElapsed(Math.max(0, (frozenAt ?? startedAt) - startedAt));
      return;
    }
    const tick = () => {
      setElapsed(Date.now() - startedAt);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [startedAt, running, frozenAt]);

  return elapsed;
}
