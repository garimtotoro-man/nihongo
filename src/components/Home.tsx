'use client';

import Link from 'next/link';
import { loadContent, type Level } from '@/lib/content';
import { useProgress } from '@/lib/store/useProgress';
import { dayKey, streak } from '@/lib/streak';
import { Onboarding } from '@/components/Onboarding';
import { PackChip } from '@/components/packs/PackChip';
import { Segment } from '@/components/Segment';
import { Mascot } from '@/components/Mascot';

const GREETINGS = [
  '오늘도 한 장씩. 그게 다예요.',
  '어제 본 글자, 오늘도 보이면 외운 거예요.',
  '뜻을 열기 전에 한 번 소리 내 읽어 봐요.',
  '저장한 카드는 홈에서 세고 있어요.',
  '헷갈리는 글자는 터치 게임으로 잡아요.',
  '5분이면 20장. 딱 그만큼만.',
  '발음 버튼, 눌러 보셨어요?',
];

const { packs } = loadContent();

export function Home() {
  const { progress, ready, update, setLevel, setActivePacks } = useProgress();

  if (!ready) return <main className="grid min-h-dvh place-items-center text-mute">불러오는 중</main>;

  if (!progress.onboarded) {
    return (
      <Onboarding
        initialPacks={progress.activePacks}
        initialLevel={progress.level}
        onDone={({ activePacks, level }) => update((p) => ({ ...p, onboarded: true, activePacks, level }))}
      />
    );
  }

  const today = progress.daily[dayKey()];
  const seenToday = today?.seen ?? 0;
  const days = streak(progress.daily);
  const greeting = GREETINGS[new Date().getDate() % GREETINGS.length];
  const togglePack = (id: (typeof packs)[number]['id']) =>
    setActivePacks(progress.activePacks.includes(id) ? progress.activePacks.filter((x) => x !== id) : [...progress.activePacks, id]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-10 pt-14">
      <header>
        <p className="text-sm font-medium text-accent">쇼츠말고 니혼고</p>
        <h1 className="mt-1 text-3xl font-bold">오늘도 한 장씩</h1>
        <div className="mt-5">
          <Mascot size={64} say={greeting} />
        </div>
      </header>

      <section className="mt-8 grid grid-cols-3 gap-3">
        <Stat label="오늘" value={`${seenToday}`} unit={`/ ${progress.settings.dailyGoal}장`} />
        <Stat label="연속" value={`${days}`} unit="일" />
        <Stat label="저장" value={`${progress.saved.length}`} unit="장" />
      </section>

      <Link
        href="/feed"
        className="mt-6 block rounded-2xl bg-accent py-5 text-center text-lg font-semibold text-white active:scale-[0.99]"
      >
        오늘 학습 시작
      </Link>

      <Link href="/kana" className="mt-3 flex items-center justify-between rounded-2xl border border-line bg-paper px-5 py-4 active:bg-sand">
        <div>
          <p className="font-semibold"><span lang="ja">あいうえお</span> 터치</p>
          <p className="mt-0.5 text-xs text-mute">글자를 순서대로 눌러 시간 재기</p>
        </div>
        <span className="text-mute">→</span>
      </Link>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-mute">내 장르</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {packs.map((p) => (
            <PackChip key={p.id} pack={p} on={progress.activePacks.includes(p.id)} onToggle={() => togglePack(p.id)} />
          ))}
        </div>
        <p className="mt-2 text-xs text-mute">고른 장르가 피드의 70%를 차지해요. 다음 세션부터 반영.</p>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-mute">레벨</h2>
        <div className="mt-3">
          <Segment<Level>
            label="레벨"
            value={progress.level}
            onChange={setLevel}
            options={[
              { value: 'N5', label: '처음이에요', hint: 'N5' },
              { value: 'N4', label: '조금 해봤어요', hint: 'N5 + N4' },
            ]}
          />
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper px-4 py-4">
      <p className="text-xs text-mute">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">
        {value} <span className="text-sm font-normal text-mute">{unit}</span>
      </p>
    </div>
  );
}
