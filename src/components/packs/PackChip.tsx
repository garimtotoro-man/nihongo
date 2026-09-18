'use client';

import type { Pack } from '@/lib/content';

type Props = { pack: Pack; on: boolean; onToggle: () => void };

/** 여러 개를 각각 켜고 끈다. 라벨은 고정, 켜진 것만 채운다. */
export function PackChip({ pack, on, onToggle }: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={onToggle}
      className={
        'flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ' +
        (on ? 'border-accent bg-accent text-white' : 'border-line bg-paper text-ink active:bg-sand')
      }
    >
      <span aria-hidden>{pack.emoji}</span>
      <span>{pack.name}</span>
    </button>
  );
}
