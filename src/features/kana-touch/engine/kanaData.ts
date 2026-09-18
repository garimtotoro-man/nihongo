// 문자 마스터 데이터. 표를 코드로 펼쳐 만든다(손으로 92개를 쓰다 생기는 오타 방지).
import type { KanaChar, KanaKind, KanaType } from './types';

type RowDef = { row: string; hira: string; kata: string; romaji: string[] };

const SEION_ROWS: RowDef[] = [
  { row: 'a', hira: 'あいうえお', kata: 'アイウエオ', romaji: ['a', 'i', 'u', 'e', 'o'] },
  { row: 'ka', hira: 'かきくけこ', kata: 'カキクケコ', romaji: ['ka', 'ki', 'ku', 'ke', 'ko'] },
  { row: 'sa', hira: 'さしすせそ', kata: 'サシスセソ', romaji: ['sa', 'shi', 'su', 'se', 'so'] },
  { row: 'ta', hira: 'たちつてと', kata: 'タチツテト', romaji: ['ta', 'chi', 'tsu', 'te', 'to'] },
  { row: 'na', hira: 'なにぬねの', kata: 'ナニヌネノ', romaji: ['na', 'ni', 'nu', 'ne', 'no'] },
  { row: 'ha', hira: 'はひふへほ', kata: 'ハヒフヘホ', romaji: ['ha', 'hi', 'fu', 'he', 'ho'] },
  { row: 'ma', hira: 'まみむめも', kata: 'マミムメモ', romaji: ['ma', 'mi', 'mu', 'me', 'mo'] },
  { row: 'ya', hira: 'やゆよ', kata: 'ヤユヨ', romaji: ['ya', 'yu', 'yo'] },
  { row: 'ra', hira: 'らりるれろ', kata: 'ラリルレロ', romaji: ['ra', 'ri', 'ru', 're', 'ro'] },
  { row: 'wa', hira: 'わをん', kata: 'ワヲン', romaji: ['wa', 'wo', 'n'] },
];

// 탁음·반탁음: 청음 row 에 대응. romaji 는 음성 파일명이므로 전부 유일해야 한다.
const VOICED_ROWS: { of: string; kind: KanaKind; hira: string; kata: string; romaji: string[] }[] = [
  { of: 'ka', kind: 'dakuon', hira: 'がぎぐげご', kata: 'ガギグゲゴ', romaji: ['ga', 'gi', 'gu', 'ge', 'go'] },
  { of: 'sa', kind: 'dakuon', hira: 'ざじずぜぞ', kata: 'ザジズゼゾ', romaji: ['za', 'ji', 'zu', 'ze', 'zo'] },
  { of: 'ta', kind: 'dakuon', hira: 'だぢづでど', kata: 'ダヂヅデド', romaji: ['da', 'di', 'du', 'de', 'do'] },
  { of: 'ha', kind: 'dakuon', hira: 'ばびぶべぼ', kata: 'バビブベボ', romaji: ['ba', 'bi', 'bu', 'be', 'bo'] },
  { of: 'ha', kind: 'handakuon', hira: 'ぱぴぷぺぽ', kata: 'パピプペポ', romaji: ['pa', 'pi', 'pu', 'pe', 'po'] },
];

// 헷갈리는 묶음. 묶음 안의 문자는 서로를 confusable 로 가진다.
const CONFUSABLE_GROUPS: string[][] = [
  // 히라가나
  ['ぬ', 'め', 'わ', 'ね', 'れ'],
  ['は', 'ほ', 'ま'],
  ['さ', 'き'],
  ['る', 'ろ'],
  ['い', 'り'],
  ['こ', 'た'],
  ['け', 'は'],
  ['あ', 'お'],
  ['う', 'つ'],
  // 가타카나
  ['シ', 'ツ', 'ミ'],
  ['ソ', 'ン', 'リ'],
  ['ク', 'ワ', 'タ'],
  ['ク', 'ケ'],
  ['ス', 'ヌ'],
  ['チ', 'テ'],
  ['フ', 'ワ'],
  ['ア', 'マ'],
  ['ウ', 'ラ'],
];

// 한글 발음. romaji → 한글. 화면 안내용이라 통용 표기를 따른다.
const KO: Record<string, string> = {
  a: '아', i: '이', u: '우', e: '에', o: '오',
  ka: '카', ki: '키', ku: '쿠', ke: '케', ko: '코',
  sa: '사', shi: '시', su: '스', se: '세', so: '소',
  ta: '타', chi: '치', tsu: '츠', te: '테', to: '토',
  na: '나', ni: '니', nu: '누', ne: '네', no: '노',
  ha: '하', hi: '히', fu: '후', he: '헤', ho: '호',
  ma: '마', mi: '미', mu: '무', me: '메', mo: '모',
  ya: '야', yu: '유', yo: '요',
  ra: '라', ri: '리', ru: '루', re: '레', ro: '로',
  wa: '와', wo: '오', n: '응',
  ga: '가', gi: '기', gu: '구', ge: '게', go: '고',
  za: '자', ji: '지', zu: '즈', ze: '제', zo: '조',
  da: '다', di: '지', du: '즈', de: '데', do: '도',
  ba: '바', bi: '비', bu: '부', be: '베', bo: '보',
  pa: '파', pi: '피', pu: '푸', pe: '페', po: '포',
};

function koOf(romaji: string): string {
  const k = KO[romaji];
  if (!k) throw new Error(`한글 발음 없음: ${romaji}`);
  return k;
}

function idOf(type: KanaType, romaji: string): string {
  return `${type === 'hiragana' ? 'hira' : 'kata'}_${romaji}`;
}

function build(): KanaChar[] {
  const out: KanaChar[] = [];
  let order = 0;
  const seionOrder = new Map<string, number>(); // `${row}:${idx}` → order

  for (const r of SEION_ROWS) {
    for (let i = 0; i < r.romaji.length; i += 1) {
      seionOrder.set(`${r.row}:${i}`, order);
      for (const type of ['hiragana', 'katakana'] as const) {
        const ro = r.romaji[i];
        out.push({
          id: idOf(type, ro),
          char: (type === 'hiragana' ? r.hira : r.kata)[i],
          kanaType: type,
          row: r.row,
          order,
          romaji: ro,
          ko: koOf(ro),
          audio: `${ro}.mp3`,
          pairId: idOf(type === 'hiragana' ? 'katakana' : 'hiragana', ro),
          confusable: [],
          kind: 'seion',
        });
      }
      order += 1;
    }
  }

  for (const v of VOICED_ROWS) {
    const base = SEION_ROWS.find((r) => r.row === v.of)!;
    for (let i = 0; i < v.romaji.length; i += 1) {
      for (const type of ['hiragana', 'katakana'] as const) {
        const ro = v.romaji[i];
        const seionId = idOf(type, base.romaji[i]);
        const id = idOf(type, ro);
        out.push({
          id,
          char: (type === 'hiragana' ? v.hira : v.kata)[i],
          kanaType: type,
          row: v.of,
          order: seionOrder.get(`${v.of}:${i}`)!,
          romaji: ro,
          ko: koOf(ro),
          audio: `${ro}.mp3`,
          pairId: idOf(type === 'hiragana' ? 'katakana' : 'hiragana', ro),
          confusable: [],
          kind: v.kind,
          seionId,
        });
        if (v.kind === 'dakuon') {
          const seion = out.find((c) => c.id === seionId)!;
          seion.dakuonId = id;
        }
      }
    }
  }

  const byChar = new Map(out.map((c) => [c.char, c]));
  for (const group of CONFUSABLE_GROUPS) {
    for (const ch of group) {
      const me = byChar.get(ch)!;
      for (const other of group) {
        if (other === ch) continue;
        const o = byChar.get(other)!;
        if (!me.confusable.includes(o.id)) me.confusable.push(o.id);
      }
    }
  }
  return out;
}

export const KANA: KanaChar[] = build();
export const KANA_BY_ID: Record<string, KanaChar> = Object.fromEntries(KANA.map((c) => [c.id, c]));

export const SEION = KANA.filter((c) => c.kind === 'seion');
export const HIRAGANA_SEION = SEION.filter((c) => c.kanaType === 'hiragana');
export const KATAKANA_SEION = SEION.filter((c) => c.kanaType === 'katakana');

/** 5글자가 꽉 찬 행(や행·わ행 제외). Level 1·2 의 "행 단위" 출제에 쓴다. */
export const FULL_ROWS = SEION_ROWS.filter((r) => r.romaji.length === 5).map((r) => r.row);
/** 탁음이 있는 행 */
export const DAKUON_ROWS = ['ka', 'sa', 'ta', 'ha'];

export function kanaById(id: string): KanaChar {
  const c = KANA_BY_ID[id];
  if (!c) throw new Error(`모르는 문자 id: ${id}`);
  return c;
}
