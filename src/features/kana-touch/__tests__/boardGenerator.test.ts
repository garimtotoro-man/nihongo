import { describe, expect, it } from 'vitest';
import { makeRng } from '@/lib/feed';
import { columnsFor, decoyCount, generateBoard, pickDistractors, soundCount } from '../engine/boardGenerator';
import { kanaById } from '../engine/kanaData';
import type { GameMode, Level } from '../engine/types';

const board = (mode: GameMode, level: Level, seed = 1, weakWeights?: Record<string, number>) =>
  generateBoard({ mode, level, rng: makeRng(seed), weakWeights });

describe('boardGenerator', () => {
  it('표 6.1: 레벨별 정답·미끼·열 수', () => {
    expect([soundCount('hiragana', 1), decoyCount('hiragana', 1), columnsFor(1)]).toEqual([5, 4, 3]);
    expect([soundCount('hiragana', 2), decoyCount('hiragana', 2), columnsFor(2)]).toEqual([10, 6, 4]);
    expect([soundCount('hiragana', 3), decoyCount('hiragana', 3), columnsFor(3)]).toEqual([15, 9, 4]);
    expect([soundCount('hiragana', 'challenge'), decoyCount('hiragana', 'challenge')]).toEqual([46, 0]);
    expect([soundCount('pair', 1), decoyCount('pair', 1)]).toEqual([3, 3]);
    expect(soundCount('dakuon', 'challenge')).toBe(20);
  });

  it('hiragana L1: 한 행 5자가 순서대로, 미끼 4, 타일 9', () => {
    const b = board('hiragana', 1);
    expect(b.sequence).toHaveLength(5);
    expect(b.tiles).toHaveLength(9);
    const rows = new Set(b.targets.map((t) => t.row));
    expect(rows.size).toBe(1);
    const orders = b.targets.map((t) => t.order);
    expect(orders).toEqual(orders.slice().sort((a, c) => a - c));
    expect(b.targets.every((t) => t.kanaType === 'hiragana')).toBe(true);
    expect(new Set(b.tiles.map((t) => t.tileId)).size).toBe(9);
    expect(b.tiles.filter((t) => t.isTarget).map((t) => t.targetIndex).sort()).toEqual([0, 1, 2, 3, 4]);
  });

  it('L2 는 두 행 10자 + 미끼 6, L3 는 15 + 9, challenge 는 46 전부', () => {
    const b2 = board('hiragana', 2);
    expect(b2.sequence).toHaveLength(10);
    expect(b2.tiles).toHaveLength(16);
    expect(new Set(b2.targets.map((t) => t.row)).size).toBe(2);
    const b3 = board('hiragana', 3);
    expect(b3.sequence).toHaveLength(15);
    expect(b3.tiles).toHaveLength(24);
    const bc = board('hiragana', 'challenge');
    expect(bc.sequence).toHaveLength(46);
    expect(bc.tiles).toHaveLength(46);
    expect(bc.sequence[0]).toBe('hira_a');
    expect(bc.sequence[45]).toBe('hira_n');
  });

  it('미끼는 confusable 우선: な행 정답이면 め·わ·れ 가 먼저 들어온다', () => {
    const targets = ['hira_na', 'hira_ni', 'hira_nu', 'hira_ne', 'hira_no'].map(kanaById);
    const d = pickDistractors(targets, 3, makeRng(3)).map((c) => c.id);
    expect(d).toHaveLength(3);
    for (const id of d) expect(['hira_me', 'hira_wa', 'hira_re']).toContain(id);
    // 부족분은 같은 종류(히라가나 청음)에서 채우고 정답과 겹치지 않는다
    const more = pickDistractors(targets, 9, makeRng(3)).map((c) => c.id);
    expect(new Set(more).size).toBe(9);
    for (const id of more) {
      expect(targets.map((t) => t.id)).not.toContain(id);
      expect(kanaById(id).kanaType).toBe('hiragana');
    }
  });

  it('katakana 는 전부 가타카나, mixed 는 소리당 1자, reverse 는 내림차순', () => {
    expect(board('katakana', 2).targets.every((t) => t.kanaType === 'katakana')).toBe(true);
    const m = board('mixed', 'challenge');
    expect(m.sequence).toHaveLength(46);
    expect(new Set(m.targets.map((t) => t.order)).size).toBe(46);
    const r = board('reverse', 'challenge');
    expect(r.sequence[0]).toBe('hira_n');
    expect(r.sequence[45]).toBe('hira_a');
  });

  it('pair: 소리마다 히라가나→가타카나, L1 은 3소리 6타일 + 미끼 3', () => {
    const b = board('pair', 1);
    expect(b.sequence).toHaveLength(6);
    expect(b.tiles).toHaveLength(9);
    for (let i = 0; i < 6; i += 2) {
      expect(b.targets[i].kanaType).toBe('hiragana');
      expect(b.targets[i + 1].kanaType).toBe('katakana');
      expect(b.targets[i + 1].id).toBe(b.targets[i].pairId);
    }
    expect(board('pair', 2).sequence).toHaveLength(10);
    expect(board('pair', 3).sequence).toHaveLength(14);
  });

  it('dakuon: 청음→탁음, か·さ·た·は 행에서만', () => {
    const b = board('dakuon', 2);
    expect(b.sequence).toHaveLength(10);
    for (let i = 0; i < b.targets.length; i += 2) {
      expect(b.targets[i].kind).toBe('seion');
      expect(b.targets[i + 1].kind).toBe('dakuon');
      expect(b.targets[i + 1].id).toBe(b.targets[i].dakuonId);
      expect(['ka', 'sa', 'ta', 'ha']).toContain(b.targets[i].row);
    }
    expect(board('dakuon', 'challenge').sequence).toHaveLength(40);
  });

  it('L3 는 약점 문자를 우선 편입한다(최대 8)', () => {
    const weights: Record<string, number> = {};
    for (const id of ['hira_nu', 'hira_me', 'hira_wa', 'hira_ne', 'hira_re', 'hira_ru', 'hira_ro', 'hira_sa', 'hira_ki', 'hira_ha']) weights[id] = 5;
    const b = board('hiragana', 3, 7, weights);
    const ids = new Set(b.sequence);
    const weakIn = Object.keys(weights).filter((id) => ids.has(id));
    expect(weakIn.length).toBeGreaterThanOrEqual(8); // 우선 8 + 무작위 보충분에 섞일 수 있음
    expect(b.sequence).toHaveLength(15);
    // 가타카나로 틀린 것도 소리 가중치에 합산된다
    const b2 = board('katakana', 3, 7, { hira_nu: 9 });
    expect(b2.sequence).toContain('kata_nu');
  });

  it('같은 시드면 같은 판', () => {
    expect(board('mixed', 3, 11)).toEqual(board('mixed', 3, 11));
    expect(board('mixed', 3, 11).tiles.map((t) => t.kanaId)).not.toEqual(board('mixed', 3, 12).tiles.map((t) => t.kanaId));
  });
});
