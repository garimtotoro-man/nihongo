// 게임 상태 전이. 시간은 전부 액션의 now 로 받는다. Date.now() 를 부르지 않는다.
import { PENALTY_HINT_MS, penaltyForMiss } from './scoring';
import type { GameAction, GameState, TapRecord } from './types';

export const initialState: GameState = {
  mode: 'hiragana',
  level: 1,
  tiles: [],
  sequence: [],
  currentIndex: 0,
  startedAt: null,
  lastCorrectAt: null,
  penaltyMs: 0,
  records: [],
  status: 'idle',
  hintVisible: false,
  lastWrongTileId: null,
  wrongTapCount: 0,
};

function freshRecords(sequence: string[]): TapRecord[] {
  return sequence.map((kanaId) => ({ kanaId, elapsedMs: 0, missCount: 0, wrongTaps: [], hintUsed: false }));
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START':
      return {
        ...initialState,
        mode: action.mode,
        level: action.level,
        tiles: action.tiles.map((t) => ({ ...t, removed: false })),
        sequence: action.sequence,
        records: freshRecords(action.sequence),
        startedAt: action.now,
        lastCorrectAt: action.now,
        status: 'playing',
      };

    case 'TAP': {
      if (state.status !== 'playing') return state;
      const tile = state.tiles.find((t) => t.tileId === action.tileId);
      if (!tile || tile.removed) return state;

      const target = state.sequence[state.currentIndex];
      const rec = state.records[state.currentIndex];

      // 판정은 tileId 가 아니라 kanaId 일치로 한다(같은 문자가 여러 장 놓일 수 있음).
      if (tile.kanaId === target) {
        const nextIndex = state.currentIndex + 1;
        const records = state.records.slice();
        records[state.currentIndex] = { ...rec, elapsedMs: action.now - (state.lastCorrectAt ?? action.now) };
        return {
          ...state,
          tiles: state.tiles.map((t) => (t.tileId === tile.tileId ? { ...t, removed: true } : t)),
          records,
          currentIndex: nextIndex,
          lastCorrectAt: action.now,
          hintVisible: false,
          lastWrongTileId: null,
          status: nextIndex === state.sequence.length ? 'cleared' : 'playing',
        };
      }

      const records = state.records.slice();
      records[state.currentIndex] = { ...rec, missCount: rec.missCount + 1, wrongTaps: [...rec.wrongTaps, tile.kanaId] };
      return {
        ...state,
        records,
        penaltyMs: state.penaltyMs + penaltyForMiss(rec.missCount),
        lastWrongTileId: tile.tileId,
        wrongTapCount: state.wrongTapCount + 1,
      };
    }

    case 'SHOW_HINT': {
      if (state.status !== 'playing' || state.hintVisible) return state;
      const rec = state.records[state.currentIndex];
      if (rec.hintUsed) return { ...state, hintVisible: true };
      const records = state.records.slice();
      records[state.currentIndex] = { ...rec, hintUsed: true };
      return { ...state, records, penaltyMs: state.penaltyMs + PENALTY_HINT_MS, hintVisible: true };
    }

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

/** 지금 눌러야 할 문자 id. 끝났으면 null. */
export function currentTarget(state: GameState): string | null {
  return state.status === 'playing' ? state.sequence[state.currentIndex] ?? null : null;
}
