import type { Progress } from './store/types';

/** 기기 로컬 날짜를 'YYYY-MM-DD' 로. */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function shiftDay(key: string, delta: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + delta));
}

/** 오늘(또는 어제)부터 거슬러 연속으로 seen>0 인 날 수. 오늘 아직 안 봤어도 어제까지 이어졌으면 끊기지 않는다. */
export function streak(daily: Progress['daily'], today: string = dayKey()): number {
  let cursor = (daily[today]?.seen ?? 0) > 0 ? today : shiftDay(today, -1);
  let n = 0;
  while ((daily[cursor]?.seen ?? 0) > 0) {
    n += 1;
    cursor = shiftDay(cursor, -1);
  }
  return n;
}
