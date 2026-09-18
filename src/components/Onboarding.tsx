'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadContent, type Level, type PackId } from '@/lib/content';
import { PackChip } from '@/components/packs/PackChip';
import { Segment } from '@/components/Segment';
import { Mascot } from '@/components/Mascot';

const { packs } = loadContent();

type Props = {
  initialPacks: PackId[];
  initialLevel: Level;
  onDone: (v: { activePacks: PackId[]; level: Level }) => void;
};

/** 첫 방문. 1단계 팩 고르기 → 2단계 레벨 → 피드. */
export function Onboarding({ initialPacks, initialLevel, onDone }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<PackId[]>(initialPacks);
  const [level, setLevel] = useState<Level>(initialLevel);

  const toggle = (id: PackId) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const start = () => {
    onDone({ activePacks: selected, level });
    router.push('/feed');
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-10 pt-16">
      <p className="text-sm font-medium text-accent">쇼츠말고 니혼고</p>
      <div className="mt-4">
        <Mascot size={64} say={step === 1 ? '안녕! 맹구예요. 배우고 싶은 장르를 골라 봐요.' : '거의 다 됐어요. 레벨은 나중에 바꿀 수 있어요.'} />
      </div>

      {step === 1 && (
        <>
          <h1 className="mt-3 text-3xl font-bold leading-tight">왜 일본어를<br />배우나요?</h1>
          <p className="mt-2 text-mute">고른 장르의 단어가 더 자주 나와요. 여러 개 골라도 돼요.</p>
          <div className="mt-8 flex flex-wrap gap-2">
            {packs.map((p) => (
              <PackChip key={p.id} pack={p} on={selected.includes(p.id)} onToggle={() => toggle(p.id)} />
            ))}
          </div>
          <div className="mt-auto pt-10">
            <button
              type="button"
              disabled={selected.length === 0}
              onClick={() => setStep(2)}
              className="w-full rounded-2xl bg-ink py-4 text-lg font-semibold text-paper disabled:opacity-30 active:scale-[0.99]"
            >
              다음
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="mt-3 text-3xl font-bold leading-tight">일본어,<br />어느 정도예요?</h1>
          <p className="mt-2 text-mute">나중에 홈에서 바꿀 수 있어요.</p>
          <div className="mt-8">
            <Segment<Level>
              label="레벨"
              value={level}
              onChange={setLevel}
              options={[
                { value: 'N5', label: '처음이에요', hint: '히라가나부터 · N5' },
                { value: 'N4', label: '조금 해봤어요', hint: 'N5 + N4' },
              ]}
            />
          </div>
          <div className="mt-auto flex gap-3 pt-10">
            <button type="button" onClick={() => setStep(1)} className="rounded-2xl border border-line bg-paper px-6 py-4 font-semibold active:bg-sand">
              이전
            </button>
            <button type="button" onClick={start} className="flex-1 rounded-2xl bg-accent py-4 text-lg font-semibold text-white active:scale-[0.99]">
              시작하기
            </button>
          </div>
        </>
      )}
    </main>
  );
}
