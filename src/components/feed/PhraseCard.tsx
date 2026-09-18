import type { Card } from '@/lib/content';
import { MeaningReveal } from './MeaningReveal';

type Props = { card: Card; onReveal?: () => void };

export function PhraseCard({ card, onReveal }: Props) {
  return (
    <div className="flex w-full flex-col items-center text-center">
      <div className="flex gap-2 text-xs text-mute">
        <span className="rounded-full bg-accent/20 px-2 py-0.5 text-accent">표현</span>
        <span className="rounded-full bg-white/10 px-2 py-0.5">{card.category}</span>
        <span className="rounded-full bg-white/10 px-2 py-0.5">{card.level}</span>
      </div>
      <p lang="ja" className="mt-6 text-4xl font-bold leading-snug">{card.jp}</p>
      <p lang="ja" className="mt-3 text-xl text-paper/80">{card.kana}</p>
      <p className="mt-1 text-base text-mute">{card.romaji}</p>
      <MeaningReveal ko={card.ko ?? ""} exampleJp={card.example_jp} exampleKo={card.example_ko} onReveal={onReveal} />
      {card.note && <p className="mt-4 text-sm text-mute">{card.note}</p>}
    </div>
  );
}
