import type { Card } from '@/lib/content';

type Props = { card: Card };

export function TipCard({ card }: Props) {
  return (
    <div className="flex w-full flex-col items-center text-center">
      <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-xs text-yellow-300">팁</span>
      <p lang="ja" className="mt-6 text-3xl font-bold leading-snug">{card.jp}</p>
      <p className="mt-6 rounded-2xl bg-white/8 px-6 py-5 text-left text-lg leading-relaxed">{card.note}</p>
    </div>
  );
}
