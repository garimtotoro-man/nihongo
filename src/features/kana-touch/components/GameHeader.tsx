'use client';

import { formatClock } from '../engine/scoring';

type Props = {
  elapsedMs: number;
  penaltyMs: number;
  done: number;
  total: number;
  onExit: () => void;
};

export function GameHeader({ elapsedMs, penaltyMs, done, total, onExit }: Props) {
  return (
    <header className="flex items-center justify-between gap-3">
      <button type="button" onClick={onExit} className="rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium active:bg-sand">
        나가기
      </button>
      <div className="text-center">
        <p className="text-2xl font-bold tabular-nums">{formatClock(elapsedMs)}</p>
        {penaltyMs > 0 && <p className="text-xs text-mute tabular-nums">+{(penaltyMs / 1000).toFixed(1)}초</p>}
      </div>
      <p className="w-16 text-right text-sm tabular-nums text-mute">
        {done} / {total}
      </p>
    </header>
  );
}
