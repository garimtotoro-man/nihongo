'use client';

import type { GameState } from '../engine/types';
import { KanaTile } from './KanaTile';

type Props = {
  state: GameState;
  columns: number;
  onTap: (tileId: string) => void;
};

export function GameBoard({ state, columns, onTap }: Props) {
  const target = state.sequence[state.currentIndex];
  const playing = state.status === 'playing';
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(48px, 1fr))` }}
      role="group"
      aria-label="글자 타일"
    >
      {state.tiles.map((t) => {
        const isShaking = state.lastWrongTileId === t.tileId;
        return (
          <KanaTile
            // 오답마다 key 를 바꿔 같은 타일이 다시 흔들리게 한다
            key={isShaking ? `${t.tileId}-${state.wrongTapCount}` : t.tileId}
            tile={t}
            hint={state.hintVisible && !t.removed && t.kanaId === target}
            shake={isShaking}
            disabled={!playing}
            onTap={onTap}
          />
        );
      })}
    </div>
  );
}
