'use client';

import { useState } from 'react';

type Props = { ko: string; exampleJp?: string; exampleKo?: string; onReveal?: () => void };

/** 뜻은 가려져 있고 탭하면 열린다. 카드가 바뀌면 key 로 다시 마운트되어 닫힌 상태로 돌아간다. */
export function MeaningReveal({ ko, exampleJp, exampleKo, onReveal }: Props) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => { setOpen(true); onReveal?.(); }}
        className="mt-8 w-full rounded-2xl border border-dashed border-white/30 px-6 py-5 text-base text-mute active:bg-white/5"
      >
        탭해서 뜻 보기
      </button>
    );
  }

  return (
    <div className="mt-8 w-full rounded-2xl bg-white/8 px-6 py-5 text-left">
      <p className="text-2xl font-semibold">{ko}</p>
      {exampleJp && (
        <div className="mt-4 space-y-1 text-base leading-relaxed">
          <p lang="ja">{exampleJp}</p>
          {exampleKo && <p className="text-mute">{exampleKo}</p>}
        </div>
      )}
    </div>
  );
}
