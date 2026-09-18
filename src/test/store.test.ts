import { describe, expect, it } from 'vitest';
import { LocalProgressStore, migrate, STORAGE_KEY } from '@/lib/store/local';
import { defaultProgress } from '@/lib/store/types';
import { dayKey, streak } from '@/lib/streak';

function memStorage() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), map: m };
}

describe('LocalProgressStore', () => {
  it('없으면 기본값, 저장하면 그대로 읽힌다', async () => {
    const s = memStorage();
    const store = new LocalProgressStore(s);
    expect(await store.load()).toEqual(defaultProgress());
    const p = { ...defaultProgress(), liked: ['ikura-desu-ka'] };
    await store.save(p);
    expect(s.map.has(STORAGE_KEY)).toBe(true);
    expect(await store.load()).toEqual(p);
  });

  it('깨진 JSON 은 기본값', async () => {
    const s = memStorage();
    s.setItem(STORAGE_KEY, '{oops');
    expect(await new LocalProgressStore(s).load()).toEqual(defaultProgress());
  });

  it('모르는 스키마 버전은 기본값으로', () => {
    expect(migrate({ schemaVersion: 0, liked: ['x'] })).toEqual(defaultProgress());
  });
});

describe('streak', () => {
  const d = (n: number) => ({ seen: n, revealed: 0, quizCorrect: 0, quizTotal: 0 });
  it('오늘 포함 연속 일수', () => {
    expect(streak({ '2026-09-18': d(3), '2026-09-17': d(1), '2026-09-16': d(2) }, '2026-09-18')).toBe(3);
  });
  it('오늘 아직 안 봤어도 어제까지 이어졌으면 유지', () => {
    expect(streak({ '2026-09-17': d(1), '2026-09-16': d(2) }, '2026-09-18')).toBe(2);
  });
  it('하루 빠지면 끊긴다', () => {
    expect(streak({ '2026-09-18': d(1), '2026-09-16': d(2) }, '2026-09-18')).toBe(1);
  });
  it('dayKey 형식', () => {
    expect(dayKey(new Date(2026, 8, 18))).toBe('2026-09-18');
  });
});
