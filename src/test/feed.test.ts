import { describe, expect, it } from 'vitest';
import { buildSession, makeRng, SESSION_SIZE, TIP_EVERY } from '@/lib/feed';
import type { Card } from '@/lib/content';
import { defaultProgress } from '@/lib/store/types';

function card(id: string, over: Partial<Card> = {}): Card {
  return { id, type: 'word', level: 'N5', packs: ['travel'], category: 'c', jp: id, kana: id, romaji: id, ko: id, ...over };
}

const A = Array.from({ length: 30 }, (_, i) => card(`a${i}`));
const B = Array.from({ length: 30 }, (_, i) => card(`b${i}`, { packs: ['love'] }));
const T = Array.from({ length: 5 }, (_, i) => card(`t${i}`, { type: 'tip', packs: [], note: 'n' }));
const N4 = Array.from({ length: 5 }, (_, i) => card(`n4-${i}`, { level: 'N4' }));
const ALL = [...A, ...B, ...T, ...N4];

describe('feed', () => {
  it('같은 시드면 같은 순서', () => {
    const p = defaultProgress();
    const x = buildSession(ALL, p, 42).map((i) => i.key);
    const y = buildSession(ALL, p, 42).map((i) => i.key);
    expect(x).toEqual(y);
    expect(buildSession(ALL, p, 43).map((i) => i.key)).not.toEqual(x);
  });

  it('팁 제외 20장, 7장마다 팁 1장, 팁이 연달아 오지 않는다', () => {
    const items = buildSession(ALL, defaultProgress(), 1);
    const body = items.filter((i) => i.card.type !== 'tip');
    const tips = items.filter((i) => i.card.type === 'tip');
    expect(body).toHaveLength(SESSION_SIZE);
    expect(tips).toHaveLength(Math.floor(SESSION_SIZE / TIP_EVERY));
    items.forEach((it, i) => {
      if (it.card.type === 'tip') expect(items[i - 1]?.card.type).not.toBe('tip');
    });
    expect(items[TIP_EVERY].card.type).toBe('tip');
  });

  it('활성 팩 70 : 나머지 30', () => {
    const items = buildSession(ALL, defaultProgress(), 7).filter((i) => i.card.type !== 'tip');
    const fromA = items.filter((i) => i.card.packs.includes('travel')).length;
    expect(fromA).toBe(14);
    expect(items.length - fromA).toBe(6);
  });

  it('N5 사용자는 N4 카드를 보지 않고, N4 사용자는 본다', () => {
    expect(buildSession(ALL, defaultProgress(), 3).some((i) => i.card.level === 'N4')).toBe(false);
    const p4 = { ...defaultProgress(), level: 'N4' as const };
    expect(buildSession([...N4, ...T], p4, 3).some((i) => i.card.level === 'N4')).toBe(true);
  });

  it('recent 에 없는 카드가 먼저 뽑힌다', () => {
    const p = defaultProgress();
    p.recent = A.slice(0, 20).map((c) => c.id); // a0~a19 는 최근 봄
    const ids = new Set(buildSession(A, p, 5).map((i) => i.card.id));
    // 30장 중 20장을 뽑으니 최근 안 본 a20~a29 열 장은 전부 들어와야 한다
    for (let i = 20; i < 30; i += 1) expect(ids.has(`a${i}`)).toBe(true);
  });

  it('seen 이 적은 카드가 먼저 뽑힌다', () => {
    const p = defaultProgress();
    for (const c of A.slice(0, 25)) p.seen[c.id] = 3; // a25~a29 만 안 봄
    const ids = new Set(buildSession(A, p, 5).map((i) => i.card.id));
    for (let i = 25; i < 30; i += 1) expect(ids.has(`a${i}`)).toBe(true);
  });

  it('풀이 모자라면 반복해서 20장을 채운다', () => {
    const items = buildSession(A.slice(0, 3), defaultProgress(), 9);
    expect(items.filter((i) => i.card.type !== 'tip')).toHaveLength(SESSION_SIZE);
    expect(new Set(items.map((i) => i.key)).size).toBe(items.length);
  });

  it('활성 팩 카드가 없으면 나머지로 채운다', () => {
    const items = buildSession(B, defaultProgress(), 9).filter((i) => i.card.type !== 'tip');
    expect(items).toHaveLength(SESSION_SIZE);
  });

  it('rng 는 0 이상 1 미만', () => {
    const rng = makeRng(123);
    for (let i = 0; i < 1000; i += 1) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
