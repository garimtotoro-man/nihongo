type Props = { current: number; total: number };

/** 칸이 나뉜 블록 게이지. 8px 마다 한 칸. */
export function ProgressBar({ current, total }: Props) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="h-3 flex-1 border-2 border-ink bg-paper p-px">
        <div className="px-gauge h-full transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm tabular-nums text-mute">{current}/{total}</span>
    </div>
  );
}
