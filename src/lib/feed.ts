import type { Card, Level } from './content';
import type { Progress } from './store/types';

export type FeedItem = { key: string; card: Card };

const LEVEL_RANK: Record<Level, number> = { N5: 0, N4: 1 };
export const SESSION_SIZE = 20; // 팁 제외 장수
export const PACK_RATIO = 0.7; // 활성 팩 비율
export const TIP_EVERY = 7; // 이 장수마다 팁 1장

/** mulberry32. 시드가 같으면 순서가 같다(테스트용). */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** recent 에 있는 카드는 뒤로, seen 이 적은 카드를 앞으로. 동률은 난수. 풀이 모자라면 처음부터 돈다. */
function pick(pool: Card[], n: number, progress: Progress, rng: () => number): Card[] {
  if (pool.length === 0 || n <= 0) return [];
  const recent = new Set(progress.recent);
  const ordered = shuffle(pool, rng).sort((a, b) => {
    const ra = recent.has(a.id) ? 1 : 0;
    const rb = recent.has(b.id) ? 1 : 0;
    if (ra !== rb) return ra - rb;
    return (progress.seen[a.id] ?? 0) - (progress.seen[b.id] ?? 0);
  });
  const out: Card[] = [];
  for (let i = 0; i < n; i += 1) out.push(ordered[i % ordered.length]);
  return out;
}

/**
 * 이번 세션 카드 목록. 순수 함수.
 * 1) 레벨 필터 → 2) A(활성 팩)·B(나머지)·T(팁) → 3) 70:30 뽑기 → 4) 7장마다 팁 1장.
 */
export function buildSession(cards: Card[], progress: Progress, seed: number, size: number = SESSION_SIZE): FeedItem[] {
  const rng = makeRng(seed);
  const maxRank = LEVEL_RANK[progress.level];
  const eligible = cards.filter((c) => LEVEL_RANK[c.level] <= maxRank);
  const active = new Set(progress.activePacks);

  const T = eligible.filter((c) => c.type === 'tip');
  const nonTip = eligible.filter((c) => c.type !== 'tip');
  const A = nonTip.filter((c) => c.packs.some((p) => active.has(p)));
  const B = nonTip.filter((c) => !c.packs.some((p) => active.has(p)));

  let nA = Math.round(size * PACK_RATIO);
  let nB = size - nA;
  if (A.length === 0) { nB = size; nA = 0; }
  if (B.length === 0) { nA = size; nB = 0; }

  const body = shuffle([...pick(A, nA, progress, rng), ...pick(B, nB, progress, rng)], rng);
  const tips = pick(T, Math.floor(body.length / TIP_EVERY), progress, rng);

  const out: Card[] = [];
  let tipIdx = 0;
  body.forEach((c, i) => {
    out.push(c);
    if ((i + 1) % TIP_EVERY === 0 && tipIdx < tips.length) out.push(tips[tipIdx++]);
  });

  // 같은 카드가 반복될 수 있어(풀 부족) 키는 위치를 포함한다.
  return out.map((card, i) => ({ key: `${seed}-${i}-${card.id}`, card }));
}
