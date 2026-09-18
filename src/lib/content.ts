import { z } from 'zod';
import packsJson from '../../content/packs.json';
import travel from '../../content/cards/travel.json';
import shopping from '../../content/cards/shopping.json';
import love from '../../content/cards/love.json';
import exam from '../../content/cards/exam.json';
import tips from '../../content/cards/tips.json';

export const PACK_IDS = ['travel', 'love', 'shopping', 'exam', 'food', 'business', 'anime', 'daily'] as const;
export const LEVELS = ['N5', 'N4'] as const;
export const CARD_TYPES = ['word', 'phrase', 'tip'] as const;

export type PackId = (typeof PACK_IDS)[number];
export type Level = (typeof LEVELS)[number];
export type CardType = (typeof CARD_TYPES)[number];

export const packSchema = z.object({
  id: z.enum(PACK_IDS),
  emoji: z.string().min(1),
  name: z.string().min(1),
  desc: z.string().min(1),
  free: z.boolean(),
  order: z.number().int().positive(),
});

export const cardSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id 는 로마자 케밥'),
    type: z.enum(CARD_TYPES),
    level: z.enum(LEVELS),
    packs: z.array(z.enum(PACK_IDS)),
    category: z.string().min(1),
    jp: z.string().min(1),
    kana: z.string().min(1).optional(),
    romaji: z.string().min(1).optional(),
    ko: z.string().min(1).optional(),
    example_jp: z.string().optional(),
    example_ko: z.string().optional(),
    note: z.string().optional(),
  })
  .superRefine((c, ctx) => {
    if (c.type === 'tip') {
      if (!c.note) ctx.addIssue({ code: 'custom', message: 'tip 은 note 필수', path: ['note'] });
    } else {
      for (const k of ['kana', 'romaji', 'ko'] as const) {
        if (!c[k]) ctx.addIssue({ code: 'custom', message: `${c.type} 은 ${k} 필수`, path: [k] });
      }
    }
  });

export type Pack = z.infer<typeof packSchema>;
export type Card = z.infer<typeof cardSchema>;

export type Content = { packs: Pack[]; cards: Card[] };

const RAW_CARD_FILES: Record<string, unknown> = { travel, shopping, love, exam, tips };

/** JSON 을 스키마로 파싱한다. 형식이 틀리면 즉시 던진다. */
export function parseContent(rawPacks: unknown = packsJson, rawCardFiles: Record<string, unknown> = RAW_CARD_FILES): Content {
  const packs = z.array(packSchema).parse(rawPacks).sort((a, b) => a.order - b.order);
  const cards: Card[] = [];
  for (const [file, raw] of Object.entries(rawCardFiles)) {
    const parsed = z.array(cardSchema).safeParse(raw);
    if (!parsed.success) throw new Error(`content/cards/${file}.json: ${parsed.error.message}`);
    cards.push(...parsed.data);
  }
  return { packs, cards };
}

/** 파일 사이를 가로지르는 규칙. 위반 목록을 돌려준다(비어 있으면 통과). */
export function validateContent(content: Content): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  const packIds = new Set(content.packs.map((p) => p.id));
  for (const c of content.cards) {
    if (seen.has(c.id)) errors.push(`카드 id 중복: ${c.id}`);
    seen.add(c.id);
    for (const p of c.packs) if (!packIds.has(p)) errors.push(`${c.id}: packs.json 에 없는 팩 ${p}`);
    if (c.type !== 'tip' && c.packs.length === 0) errors.push(`${c.id}: word·phrase 는 팩이 하나 이상`);
  }
  const packSeen = new Set<string>();
  for (const p of content.packs) {
    if (packSeen.has(p.id)) errors.push(`팩 id 중복: ${p.id}`);
    packSeen.add(p.id);
  }
  return errors;
}

let cached: Content | null = null;
/** 앱에서 쓰는 콘텐츠. 첫 호출에 파싱·검증하고 이후 재사용한다. */
export function loadContent(): Content {
  if (cached) return cached;
  const content = parseContent();
  const errors = validateContent(content);
  if (errors.length) throw new Error(`콘텐츠 검증 실패:\n${errors.join('\n')}`);
  cached = content;
  return content;
}
