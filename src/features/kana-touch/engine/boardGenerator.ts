// 타일 구성 생성. 순수 함수. 난수는 rng 로 주입한다.
import { DAKUON_ROWS, FULL_ROWS, HIRAGANA_SEION, KANA, kanaById } from './kanaData';
import type { GameMode, KanaChar, Level, Rng, Tile } from './types';

export type Board = {
  tiles: Tile[];
  sequence: string[];
  targets: KanaChar[];
  columns: number;
};

export type BoardOptions = {
  mode: GameMode;
  level: Level;
  rng: Rng;
  weakWeights?: Record<string, number>;
};

export const MAX_WEAK_TARGETS = 8;

export function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const isPairLike = (mode: GameMode) => mode === 'pair' || mode === 'dakuon';

/** 레벨별 "소리" 수. pair·dakuon 은 소리마다 타일 2장이라 절반이다. */
export function soundCount(mode: GameMode, level: Level): number {
  if (level === 'challenge') return mode === 'dakuon' ? 20 : 46;
  const base = { 1: 5, 2: 10, 3: 15 }[level];
  if (!isPairLike(mode)) return base;
  return { 1: 3, 2: 5, 3: 7 }[level];
}

export function decoyCount(mode: GameMode, level: Level): number {
  if (level === 'challenge') return 0;
  if (isPairLike(mode) && level === 1) return 3;
  return { 1: 4, 2: 6, 3: 9 }[level];
}

export function columnsFor(level: Level): number {
  return level === 1 ? 3 : level === 'challenge' ? 6 : 4;
}

/** 소리는 히라가나 청음 한 글자로 대표한다. */
function soundPool(mode: GameMode): KanaChar[] {
  if (mode === 'dakuon') return HIRAGANA_SEION.filter((c) => DAKUON_ROWS.includes(c.row));
  return HIRAGANA_SEION;
}

function soundWeight(sound: KanaChar, weights: Record<string, number>): number {
  return (weights[sound.id] ?? 0) + (weights[sound.pairId] ?? 0) + (sound.dakuonId ? weights[sound.dakuonId] ?? 0 : 0);
}

/** 가중치 상위 문자를 최대 maxWeak 까지 우선 넣고 나머지는 랜덤. */
export function pickWithWeak(candidates: KanaChar[], n: number, weights: Record<string, number>, rng: Rng, maxWeak = MAX_WEAK_TARGETS): KanaChar[] {
  const weighted = candidates
    .filter((c) => soundWeight(c, weights) > 0)
    .sort((a, b) => soundWeight(b, weights) - soundWeight(a, weights));
  const picked = shuffle(weighted, rng)
    .sort((a, b) => soundWeight(b, weights) - soundWeight(a, weights))
    .slice(0, Math.min(maxWeak, n));
  const pickedIds = new Set(picked.map((c) => c.id));
  const rest = shuffle(candidates.filter((c) => !pickedIds.has(c.id)), rng).slice(0, n - picked.length);
  return [...picked, ...rest];
}

/** 레벨 규칙대로 소리를 고른다. */
export function pickSounds(mode: GameMode, level: Level, rng: Rng, weights: Record<string, number> = {}): KanaChar[] {
  const pool = soundPool(mode);
  const rows = mode === 'dakuon' ? DAKUON_ROWS : FULL_ROWS;
  const n = soundCount(mode, level);

  if (level === 'challenge') return pool.slice();

  if (level === 1) {
    const row = shuffle(rows, rng)[0];
    const inRow = pool.filter((c) => c.row === row);
    return n >= inRow.length ? inRow : shuffle(inRow, rng).slice(0, n);
  }

  if (level === 2) {
    const picked = shuffle(rows, rng).slice(0, isPairLike(mode) ? 1 : 2);
    return pool.filter((c) => picked.includes(c.row));
  }

  return pickWithWeak(pool, n, weights, rng);
}

/** 소리 → 이 모드에서 눌러야 할 문자들(순서 포함). */
export function expandSound(sound: KanaChar, mode: GameMode, rng: Rng): KanaChar[] {
  const kata = kanaById(sound.pairId);
  switch (mode) {
    case 'hiragana':
    case 'reverse':
      return [sound];
    case 'katakana':
      return [kata];
    case 'mixed':
      return [rng() < 0.5 ? sound : kata];
    case 'pair':
      return [sound, kata];
    case 'dakuon':
      if (!sound.dakuonId) throw new Error(`탁음이 없는 소리: ${sound.id}`);
      return [sound, kanaById(sound.dakuonId)];
  }
}

/** 미끼. 랜덤 금지: 정답의 confusable 에서 먼저 뽑고 부족분만 같은 종류에서 채운다. */
export function pickDistractors(targets: KanaChar[], count: number, rng: Rng): KanaChar[] {
  if (count <= 0) return [];
  const targetIds = new Set(targets.map((t) => t.id));
  const pool = targets.flatMap((t) => t.confusable).filter((id) => !targetIds.has(id));
  const unique = shuffle([...new Set(pool)], rng);
  const picked = unique.slice(0, count).map(kanaById);
  if (picked.length >= count) return picked;

  const types = new Set(targets.map((t) => t.kanaType));
  const kinds = new Set(targets.map((t) => t.kind));
  const pickedIds = new Set(picked.map((c) => c.id));
  const fill = shuffle(
    KANA.filter((c) => types.has(c.kanaType) && kinds.has(c.kind) && !targetIds.has(c.id) && !pickedIds.has(c.id)),
    rng,
  ).slice(0, count - picked.length);
  return [...picked, ...fill];
}

export function generateBoard({ mode, level, rng, weakWeights = {} }: BoardOptions): Board {
  const sounds = pickSounds(mode, level, rng, weakWeights).sort((a, b) => a.order - b.order);
  if (mode === 'reverse') sounds.reverse();

  const targets = sounds.flatMap((s) => expandSound(s, mode, rng));
  const sequence = targets.map((t) => t.id);
  const decoys = pickDistractors(targets, decoyCount(mode, level), rng);

  const raw: Omit<Tile, 'tileId'>[] = [
    ...targets.map((t, i) => ({ kanaId: t.id, char: t.char, isTarget: true, targetIndex: i, removed: false })),
    ...decoys.map((d) => ({ kanaId: d.id, char: d.char, isTarget: false, targetIndex: -1, removed: false })),
  ];
  const tiles = shuffle(raw, rng).map((t, i) => ({ ...t, tileId: `t${i}` }));

  return { tiles, sequence, targets, columns: columnsFor(level) };
}
