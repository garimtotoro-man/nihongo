import { describe, expect, it } from 'vitest';
import { currentTarget, gameReducer, initialState } from '../engine/gameReducer';
import type { GameState, Tile } from '../engine/types';

const tile = (tileId: string, kanaId: string, targetIndex = -1): Tile => ({
  tileId,
  kanaId,
  char: kanaId,
  isTarget: targetIndex >= 0,
  targetIndex,
  removed: false,
});

function started(): GameState {
  return gameReducer(initialState, {
    type: 'START',
    mode: 'hiragana',
    level: 1,
    now: 1000,
    sequence: ['hira_na', 'hira_ni', 'hira_nu'],
    tiles: [tile('t0', 'hira_nu', 2), tile('t1', 'hira_me'), tile('t2', 'hira_na', 0), tile('t3', 'hira_ni', 1)],
  });
}

describe('gameReducer', () => {
  it('START: 기록 슬롯을 시퀀스 수만큼 만들고 playing 이 된다', () => {
    const s = started();
    expect(s.status).toBe('playing');
    expect(s.records).toHaveLength(3);
    expect(s.startedAt).toBe(1000);
    expect(s.lastCorrectAt).toBe(1000);
    expect(currentTarget(s)).toBe('hira_na');
  });

  it('정답: 타일 제거, 순번 증가, 경과 시간 기록, 힌트 닫힘', () => {
    let s = started();
    s = gameReducer(s, { type: 'SHOW_HINT', now: 6000 });
    expect(s.hintVisible).toBe(true);
    s = gameReducer(s, { type: 'TAP', tileId: 't2', now: 6500 });
    expect(s.tiles.find((t) => t.tileId === 't2')?.removed).toBe(true);
    expect(s.currentIndex).toBe(1);
    expect(s.records[0].elapsedMs).toBe(5500);
    expect(s.lastCorrectAt).toBe(6500);
    expect(s.hintVisible).toBe(false);
    expect(currentTarget(s)).toBe('hira_ni');
  });

  it('오답: 첫 오답 +1000, 같은 타깃 재오답 +2000, wrongTaps 누적, 타일은 남는다', () => {
    let s = started();
    s = gameReducer(s, { type: 'TAP', tileId: 't1', now: 1500 });
    expect(s.penaltyMs).toBe(1000);
    expect(s.records[0].missCount).toBe(1);
    expect(s.records[0].wrongTaps).toEqual(['hira_me']);
    expect(s.tiles.find((t) => t.tileId === 't1')?.removed).toBe(false);
    expect(s.lastWrongTileId).toBe('t1');

    s = gameReducer(s, { type: 'TAP', tileId: 't0', now: 1800 });
    expect(s.penaltyMs).toBe(3000);
    expect(s.records[0].missCount).toBe(2);
    expect(s.records[0].wrongTaps).toEqual(['hira_me', 'hira_nu']);
    expect(s.wrongTapCount).toBe(2);

    // 다음 타깃으로 넘어가면 미스 카운트는 새로 센다
    s = gameReducer(s, { type: 'TAP', tileId: 't2', now: 2000 });
    s = gameReducer(s, { type: 'TAP', tileId: 't1', now: 2100 });
    expect(s.penaltyMs).toBe(4000);
  });

  it('제거된 타일을 다시 누르면 아무 일도 없다', () => {
    let s = started();
    s = gameReducer(s, { type: 'TAP', tileId: 't2', now: 2000 });
    const again = gameReducer(s, { type: 'TAP', tileId: 't2', now: 2500 });
    expect(again).toBe(s);
  });

  it('모두 맞히면 cleared, 이후 입력은 무시', () => {
    let s = started();
    s = gameReducer(s, { type: 'TAP', tileId: 't2', now: 2000 });
    s = gameReducer(s, { type: 'TAP', tileId: 't3', now: 3000 });
    s = gameReducer(s, { type: 'TAP', tileId: 't0', now: 4000 });
    expect(s.status).toBe('cleared');
    expect(s.currentIndex).toBe(3);
    expect(currentTarget(s)).toBeNull();
    expect(gameReducer(s, { type: 'TAP', tileId: 't1', now: 5000 })).toBe(s);
  });

  it('힌트: 한 문자당 +3000 한 번만', () => {
    let s = started();
    s = gameReducer(s, { type: 'SHOW_HINT', now: 6000 });
    expect(s.penaltyMs).toBe(3000);
    expect(s.records[0].hintUsed).toBe(true);
    s = { ...s, hintVisible: false };
    s = gameReducer(s, { type: 'SHOW_HINT', now: 12000 });
    expect(s.penaltyMs).toBe(3000);
    expect(s.hintVisible).toBe(true);
  });

  it('판정은 kanaId 로: 같은 문자 타일이 둘이면 어느 쪽을 눌러도 정답', () => {
    const s0 = gameReducer(initialState, {
      type: 'START',
      mode: 'hiragana',
      level: 'challenge',
      now: 0,
      sequence: ['hira_a'],
      tiles: [tile('t0', 'hira_a', 0), tile('t1', 'hira_a')],
    });
    const s = gameReducer(s0, { type: 'TAP', tileId: 't1', now: 100 });
    expect(s.status).toBe('cleared');
    expect(s.tiles.find((t) => t.tileId === 't1')?.removed).toBe(true);
    expect(s.tiles.find((t) => t.tileId === 't0')?.removed).toBe(false);
  });

  it('RESET 은 초기 상태', () => {
    expect(gameReducer(started(), { type: 'RESET' })).toEqual(initialState);
  });
});
