'use client';

import type { Tile } from '../engine/types';

type Props = {
  tile: Tile;
  hint: boolean; // 정답 타일 발광
  shake: boolean; // 오답 흔들림
  disabled: boolean;
  onTap: (tileId: string) => void;
};

/** 타일 1개. 최소 48×48, 간격은 보드에서 12px. 제거되면 150ms 로 사라지고 자리는 남긴다. */
export function KanaTile({ tile, hint, shake, disabled, onTap }: Props) {
  return (
    <button
      type="button"
      lang="ja"
      disabled={disabled || tile.removed}
      onClick={() => onTap(tile.tileId)}
      aria-label={tile.char}
      className={
        'kt-tile grid aspect-square min-h-12 min-w-12 place-items-center rounded-2xl border border-line bg-paper text-3xl font-semibold text-ink shadow-sm active:scale-95 ' +
        (tile.removed ? 'kt-removed ' : '') +
        (hint ? 'kt-hint ' : '') +
        (shake ? 'kt-shake ' : '')
      }
    >
      {tile.char}
    </button>
  );
}
