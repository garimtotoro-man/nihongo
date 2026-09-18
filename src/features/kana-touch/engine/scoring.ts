// 시간·페널티 계산. 순수 함수.
import type { GameResult, GameState, TapRecord } from './types';

export const PENALTY_FIRST_MISS_MS = 1000;
export const PENALTY_REPEAT_MISS_MS = 2000;
export const PENALTY_HINT_MS = 3000;
export const HINT_DELAY_MS = 5000;
export const SLOW_TAP_MS = 2000;

/** 현재 타깃에 대한 누적 미스 횟수(이번 오답 이전) 기준. */
export function penaltyForMiss(missCountBefore: number): number {
  return missCountBefore === 0 ? PENALTY_FIRST_MISS_MS : PENALTY_REPEAT_MISS_MS;
}

export function totalMisses(records: TapRecord[]): number {
  return records.reduce((n, r) => n + r.missCount, 0);
}

/** 클리어된 상태에서 결과를 만든다. 마지막 정답 시각이 종료 시각이다. */
export function buildResult(state: GameState, previousBestMs: number | null, playedAt: string): GameResult {
  if (state.startedAt === null) throw new Error('시작하지 않은 판');
  const endAt = state.lastCorrectAt ?? state.startedAt;
  const actualMs = Math.max(0, endAt - state.startedAt);
  const totalMs = actualMs + state.penaltyMs;
  return {
    mode: state.mode,
    level: state.level,
    actualMs,
    penaltyMs: state.penaltyMs,
    totalMs,
    missCount: totalMisses(state.records),
    records: state.records,
    isNewRecord: previousBestMs === null || totalMs < previousBestMs,
    previousBestMs,
    playedAt,
  };
}

/** 오래 걸린 문자 순. elapsedMs 내림차순, 같으면 미스가 많은 쪽. 0ms 기록은 뺀다. */
export function slowestRecords(records: TapRecord[], n = 3): TapRecord[] {
  return records
    .filter((r) => r.elapsedMs > 0 || r.missCount > 0)
    .slice()
    .sort((a, b) => b.elapsedMs - a.elapsedMs || b.missCount - a.missCount)
    .slice(0, n);
}

/** 16.4 처럼 소수 첫째 자리까지. */
export function formatSeconds(ms: number): string {
  return (Math.max(0, ms) / 1000).toFixed(1);
}

/** 00:12.4 형식. */
export function formatClock(ms: number): string {
  const total = Math.max(0, ms);
  const m = Math.floor(total / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const d = Math.floor((total % 1000) / 100);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${d}`;
}
