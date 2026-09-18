import { describe, expect, it } from 'vitest';
import { DAKUON_ROWS, FULL_ROWS, HIRAGANA_SEION, KANA, KANA_BY_ID, KATAKANA_SEION, kanaById } from '../engine/kanaData';

describe('kanaData', () => {
  it('청음 히라가나 46 · 가타카나 46, 탁음·반탁음 25×2', () => {
    expect(HIRAGANA_SEION).toHaveLength(46);
    expect(KATAKANA_SEION).toHaveLength(46);
    expect(KANA.filter((c) => c.kind === 'dakuon')).toHaveLength(40);
    expect(KANA.filter((c) => c.kind === 'handakuon')).toHaveLength(10);
    expect(KANA).toHaveLength(142);
  });

  it('id·문자·음성 파일명이 유일하다', () => {
    expect(new Set(KANA.map((c) => c.id)).size).toBe(KANA.length);
    expect(new Set(KANA.map((c) => c.char)).size).toBe(KANA.length);
    for (const type of ['hiragana', 'katakana'] as const) {
      const ro = KANA.filter((c) => c.kanaType === type).map((c) => c.audio);
      expect(new Set(ro).size).toBe(ro.length);
    }
  });

  it('오십음 순번이 0~45 이고 짝(pairId)은 반대 종류의 같은 소리', () => {
    expect(HIRAGANA_SEION.map((c) => c.order)).toEqual(Array.from({ length: 46 }, (_, i) => i));
    for (const c of KANA) {
      const p = kanaById(c.pairId);
      expect(p.kanaType).not.toBe(c.kanaType);
      expect(p.romaji).toBe(c.romaji);
      expect(p.order).toBe(c.order);
    }
  });

  it('confusable 은 존재하는 같은 종류의 문자이고 명세의 묶음이 들어 있다', () => {
    for (const c of KANA) {
      for (const id of c.confusable) {
        expect(KANA_BY_ID[id]).toBeDefined();
        expect(KANA_BY_ID[id].kanaType).toBe(c.kanaType);
        expect(id).not.toBe(c.id);
      }
    }
    const byChar = (ch: string) => KANA.find((c) => c.char === ch)!;
    expect(byChar('ぬ').confusable).toEqual(expect.arrayContaining(['hira_me', 'hira_wa', 'hira_ne', 'hira_re']));
    expect(byChar('は').confusable).toEqual(expect.arrayContaining(['hira_ho', 'hira_ma', 'hira_ke']));
    expect(byChar('シ').confusable).toEqual(expect.arrayContaining(['kata_tsu', 'kata_mi']));
    expect(byChar('ク').confusable).toEqual(expect.arrayContaining(['kata_wa', 'kata_ta', 'kata_ke']));
  });

  it('탁음 연결: か→が, は→ば, 반탁음 ぱ 는 seionId 만 갖는다', () => {
    expect(kanaById('hira_ka').dakuonId).toBe('hira_ga');
    expect(kanaById('hira_ga').seionId).toBe('hira_ka');
    expect(kanaById('kata_ha').dakuonId).toBe('kata_ba');
    expect(kanaById('hira_pa').seionId).toBe('hira_ha');
    expect(kanaById('hira_ha').dakuonId).toBe('hira_ba');
    expect(kanaById('hira_ga').order).toBe(kanaById('hira_ka').order);
  });

  it('모든 문자에 한글 발음이 있고 화면 안내는 글자를 드러내지 않는다', () => {
    for (const c of KANA) {
      expect(c.ko.length).toBeGreaterThan(0);
      expect(c.ko).not.toBe(c.char);
    }
    expect(kanaById('hira_u').ko).toBe('우');
    expect(kanaById('kata_u').ko).toBe('우');
    expect(kanaById('hira_ga').ko).toBe('가');
  });

  it('행 상수', () => {
    expect(FULL_ROWS).toEqual(['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ra']);
    for (const row of DAKUON_ROWS) {
      for (const c of HIRAGANA_SEION.filter((x) => x.row === row)) expect(c.dakuonId).toBeDefined();
    }
  });
});
