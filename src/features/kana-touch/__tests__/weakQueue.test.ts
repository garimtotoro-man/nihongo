import { describe, expect, it } from 'vitest';
import { applyDelta, topWeak, weightDelta } from '../engine/weakQueue';
import type { GameResult, TapRecord } from '../engine/types';

const rec = (kanaId: string, over: Partial<TapRecord> = {}): TapRecord => ({
  kanaId,
  elapsedMs: 800,
  missCount: 0,
  wrongTaps: [],
  hintUsed: false,
  ...over,
});

const result = (records: TapRecord[]): GameResult => ({
  mode: 'hiragana',
  level: 1,
  actualMs: 0,
  penaltyMs: 0,
  totalMs: 0,
  missCount: records.reduce((n, r) => n + r.missCount, 0),
  records,
  isNewRecord: false,
  previousBestMs: null,
  playedAt: '2026-09-18T00:00:00.000Z',
});

describe('weakQueue', () => {
  it('오답 1회 +3, 2000ms 초과 +1', () => {
    const d = weightDelta(result([rec('hira_nu', { missCount: 2, elapsedMs: 2500 }), rec('hira_na')]));
    expect(d).toEqual({ hira_nu: 7 });
  });

  it('연속 2회 무오답이면 -1 (직전에 만난 판이 무오답이어야 한다)', () => {
    const prevClean = result([rec('hira_nu')]);
    const prevMiss = result([rec('hira_nu', { missCount: 1 })]);
    expect(weightDelta(result([rec('hira_nu')]), [prevClean])).toEqual({ hira_nu: -1 });
    expect(weightDelta(result([rec('hira_nu')]), [prevMiss])).toEqual({});
    expect(weightDelta(result([rec('hira_nu')]), [])).toEqual({});
    // 최신 판 기준: 최근이 오답이면 그 전이 깨끗해도 감점 없음
    expect(weightDelta(result([rec('hira_nu')]), [prevMiss, prevClean])).toEqual({});
  });

  it('applyDelta 는 0 아래로 내려가지 않고 0 이 되면 지운다', () => {
    expect(applyDelta({ hira_nu: 1 }, { hira_nu: -3, hira_me: 3 })).toEqual({ hira_me: 3 });
    expect(applyDelta({}, { hira_nu: 4 })).toEqual({ hira_nu: 4 });
  });

  it('topWeak 는 가중치 내림차순 상위 n', () => {
    expect(topWeak({ a: 1, b: 5, c: 3, d: 0 }, 2)).toEqual(['b', 'c']);
  });
});
