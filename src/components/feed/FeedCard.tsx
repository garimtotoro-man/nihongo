'use client';

import type { Card } from '@/lib/content';
import { TtsButton } from '@/components/TtsButton';
import { WordCard } from './WordCard';
import { PhraseCard } from './PhraseCard';
import { TipCard } from './TipCard';

type Props = {
  card: Card;
  liked: boolean;
  saved: boolean;
  ttsRate: number;
  voiceURI?: string;
  onLike: () => void;
  onSave: () => void;
  onReveal: () => void;
};

/** 라벨은 고정, 켜진 쪽만 색으로 채운다. */
function RailButton({ on, icon, label, onClick }: { on: boolean; icon: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-on={on || undefined}
      className="flex flex-col items-center gap-1 text-paper active:scale-95 data-on:text-accent"
    >
      <span className="grid size-12 place-items-center rounded-full bg-white/10 text-2xl data-on:bg-accent/25">{icon}</span>
      <span className="text-[11px]">{label}</span>
    </button>
  );
}

export function FeedCard({ card, liked, saved, ttsRate, voiceURI, onLike, onSave, onReveal }: Props) {
  const speakText = card.kana ?? card.jp;
  return (
    <article className="relative flex h-dvh snap-start snap-always items-center px-6 pb-24 pt-20">
      <div className="mx-auto w-full max-w-sm pr-14">
        {card.type === 'word' && <WordCard card={card} onReveal={onReveal} />}
        {card.type === 'phrase' && <PhraseCard card={card} onReveal={onReveal} />}
        {card.type === 'tip' && <TipCard card={card} />}
      </div>
      <div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-5">
        {card.type !== 'tip' && <TtsButton text={speakText} rate={ttsRate} voiceURI={voiceURI} />}
        <RailButton on={liked} icon="♥" label="좋아요" onClick={onLike} />
        <RailButton on={saved} icon="🔖" label="저장" onClick={onSave} />
      </div>
    </article>
  );
}
