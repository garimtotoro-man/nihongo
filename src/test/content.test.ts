import { describe, expect, it } from 'vitest';
import { loadContent, parseContent, validateContent } from '@/lib/content';

const base = { type: 'word', level: 'N5', packs: ['travel'], category: 'c', jp: 'あ', kana: 'あ', romaji: 'a', ko: '아' };

describe('content', () => {
  it('저장소 콘텐츠가 스키마와 교차 규칙을 통과한다', () => {
    const content = loadContent();
    expect(content.cards.length).toBeGreaterThan(0);
    expect(validateContent(content)).toEqual([]);
  });

  it('word·phrase 는 kana·romaji·ko 가 없으면 실패한다', () => {
    expect(() =>
      parseContent(undefined, { x: [{ id: 'a', type: 'word', level: 'N5', packs: ['travel'], category: 'c', jp: 'あ' }] }),
    ).toThrow(/kana/);
  });

  it('tip 은 note 가 없으면 실패한다', () => {
    expect(() =>
      parseContent(undefined, { x: [{ id: 'a', type: 'tip', level: 'N5', packs: [], category: 'c', jp: 'あ' }] }),
    ).toThrow(/note/);
  });

  it('id 중복과 없는 팩을 잡는다', () => {
    const content = parseContent(undefined, { x: [{ ...base, id: 'dup' }, { ...base, id: 'dup' }] });
    content.cards[1].packs = ['ghost' as never];
    const errors = validateContent(content);
    expect(errors.some((e) => e.includes('중복'))).toBe(true);
    expect(errors.some((e) => e.includes('ghost'))).toBe(true);
  });

  it('id 는 로마자 케밥만 허용한다', () => {
    expect(() => parseContent(undefined, { x: [{ ...base, id: 'Ikura_Desu' }] })).toThrow();
  });
});
