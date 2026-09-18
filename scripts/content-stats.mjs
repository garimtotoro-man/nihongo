// 팩별 장수와 종류 비율을 숫자로만 보여 준다. 강제하지 않는다.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../content/', import.meta.url);
const packs = JSON.parse(readFileSync(new URL('packs.json', root), 'utf8'));
const cardsDir = new URL('cards/', root);
const cards = readdirSync(cardsDir)
  .filter((f) => f.endsWith('.json'))
  .flatMap((f) => JSON.parse(readFileSync(fileURLToPath(new URL(f, cardsDir)), 'utf8')));

const total = cards.length;
const byType = {};
for (const c of cards) byType[c.type] = (byType[c.type] ?? 0) + 1;

console.log(`전체 ${total}장`);
for (const t of ['word', 'phrase', 'tip']) {
  const n = byType[t] ?? 0;
  console.log(`  ${t.padEnd(6)} ${String(n).padStart(3)}장  ${total ? Math.round((n / total) * 100) : 0}%  (목표 word 50 · phrase 35 · tip 15)`);
}
console.log('팩별');
for (const p of packs.sort((a, b) => a.order - b.order)) {
  const n = cards.filter((c) => c.packs.includes(p.id)).length;
  console.log(`  ${p.emoji} ${p.name.padEnd(5)} ${String(n).padStart(3)}장`);
}
