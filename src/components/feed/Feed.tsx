'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { loadContent } from '@/lib/content';
import { buildSession, SESSION_SIZE } from '@/lib/feed';
import { useProgress } from '@/lib/store/useProgress';
import { ProgressBar } from '@/components/ProgressBar';
import { FeedCard } from './FeedCard';
import { Mascot } from '@/components/Mascot';

const { cards } = loadContent();

export function Feed() {
  const { progress, ready, toggleLike, toggleSave, markSeen, markRevealed } = useProgress();
  const [seed, setSeed] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);
  const seenKeys = useRef(new Set<string>());
  const scrollerRef = useRef<HTMLDivElement>(null);
  // 세션은 seed 가 정해질 때의 진도(recent·seen)로 한 번 만든다. 세션 중 좋아요·저장이 바뀌어도 순서를 다시 섞지 않는다.
  const progressAtSeed = useRef(progress);

  useEffect(() => {
    if (ready && seed === null) {
      progressAtSeed.current = progress;
      setSeed(Date.now());
    }
  }, [ready, seed, progress]);

  const items = useMemo(
    () => (seed === null ? [] : buildSession(cards, progressAtSeed.current, seed)),
    [seed],
  );

  // 화면 한가운데 보이는 카드 추적. 처음 보일 때 한 번만 seen 처리.
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root || items.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          const idx = Number(el.dataset.index);
          const key = el.dataset.key ?? '';
          setCurrent(idx);
          if (key && !seenKeys.current.has(key) && idx < items.length) {
            seenKeys.current.add(key);
            markSeen(items[idx].card.id);
          }
        }
      },
      { root, threshold: 0.6 },
    );
    root.querySelectorAll<HTMLElement>('[data-index]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items, markSeen]);

  const nextSession = () => {
    seenKeys.current.clear();
    setCurrent(0);
    progressAtSeed.current = progress;
    setSeed(Date.now());
    scrollerRef.current?.scrollTo({ top: 0 });
  };

  const bodyCount = items.filter((it) => it.card.type !== 'tip').length || SESSION_SIZE;
  const bodyDone = Math.min(bodyCount, items.slice(0, current + 1).filter((it) => it.card.type !== 'tip').length);

  return (
    <div className="relative mx-auto h-dvh max-w-md">
      <header className="absolute inset-x-0 top-0 z-10 flex items-center gap-3 bg-sand/90 px-4 pt-3 pb-2 backdrop-blur">
        <Link href="/" aria-label="홈으로" className="grid size-9 shrink-0 place-items-center rounded-full bg-ink/5 text-ink active:scale-95">
          ←
        </Link>
        <div className="flex-1">
          <ProgressBar current={bodyDone} total={bodyCount} />
        </div>
      </header>

      <div ref={scrollerRef} className="h-full snap-y snap-mandatory overflow-y-auto [scrollbar-width:none]">
        {items.length === 0 && <div className="grid h-dvh place-items-center text-mute">불러오는 중</div>}
        {items.map((it, i) => (
          <div key={it.key} data-index={i} data-key={it.key}>
            <FeedCard
              card={it.card}
              liked={progress.liked.includes(it.card.id)}
              saved={progress.saved.includes(it.card.id)}
              ttsRate={progress.settings.ttsRate}
              voiceURI={progress.settings.voiceURI}
              onLike={() => toggleLike(it.card.id)}
              onSave={() => toggleSave(it.card.id)}
              onReveal={markRevealed}
            />
          </div>
        ))}
        {items.length > 0 && (
          <section
            data-index={items.length}
            data-key="done"
            className="flex h-dvh snap-start flex-col items-center justify-center gap-6 px-6 text-center"
          >
            <Mascot size={96} say={`오늘 ${bodyCount}장 완료! 내일 또 봐요.`} />
            <p className="text-2xl font-bold">오늘 {bodyCount}장 완료</p>
            <p className="text-mute">저장한 카드 {progress.saved.length}장</p>
            <Link href="/" className="text-sm text-mute underline-offset-4 hover:underline">
              홈으로
            </Link>
            <button
              type="button"
              onClick={nextSession}
              className="rounded-full bg-accent px-8 py-3 text-lg font-semibold text-white active:scale-95"
            >
              계속 보기
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
