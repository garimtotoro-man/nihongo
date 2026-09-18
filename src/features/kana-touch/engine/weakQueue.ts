// 약점 문자 가중치. 순수 함수.
//   오답 1회당 +3, 반응 2000ms 초과 +1, 연속 2회 무오답 클리어 -1 (최소 0)
import { SLOW_TAP_MS } from './scoring';
import type { GameResult } from './types';

export const WEIGHT_PER_MISS = 3;
export const WEIGHT_SLOW = 1;
export const WEIGHT_CLEAN_STREAK = -1;

/** 이 문자를 마지막으로 만난 판(history 최신순)에서 무오답이었는가. */
function lastTimeWasClean(kanaId: string, history: GameResult[]): boolean {
  for (const past of history) {
    const rec = past.records.find((r) => r.kanaId === kanaId);
    if (rec) return rec.missCount === 0;
  }
  return false;
}

/** 이번 결과가 만드는 가중치 변화. history 는 이번 판을 제외한 최신순 목록. */
export function weightDelta(result: GameResult, history: GameResult[] = []): Record<string, number> {
  const delta: Record<string, number> = {};
  for (const r of result.records) {
    let d = r.missCount * WEIGHT_PER_MISS;
    if (r.elapsedMs > SLOW_TAP_MS) d += WEIGHT_SLOW;
    if (r.missCount === 0 && lastTimeWasClean(r.kanaId, history)) d += WEIGHT_CLEAN_STREAK;
    if (d !== 0) delta[r.kanaId] = (delta[r.kanaId] ?? 0) + d;
  }
  return delta;
}

export function applyDelta(weights: Record<string, number>, delta: Record<string, number>): Record<string, number> {
  const next = { ...weights };
  for (const [id, d] of Object.entries(delta)) {
    const v = Math.max(0, (next[id] ?? 0) + d);
    if (v === 0) delete next[id];
    else next[id] = v;
  }
  return next;
}

/** 가중치 상위 n개 id. */
export function topWeak(weights: Record<string, number>, n: number): string[] {
  return Object.entries(weights)
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id]) => id);
}
