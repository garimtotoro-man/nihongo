'use client';

import { Mascot } from '@/components/Mascot';
import { kanaById } from '../engine/kanaData';
import { formatSeconds, slowestRecords } from '../engine/scoring';
import type { GameResult, Level } from '../engine/types';

type Props = {
  result: GameResult;
  onRetry: () => void;
  onNext: (level: Level) => void;
  onExit: () => void;
};

export const NEXT_LEVEL: Record<string, Level | null> = { 1: 2, 2: 3, 3: 'challenge', challenge: null };

export function ResultScreen({ result, onRetry, onNext, onExit }: Props) {
  const slow = slowestRecords(result.records, 3);
  const next = NEXT_LEVEL[String(result.level)];
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-10 pt-12">
      <p className="text-center text-sm text-mute">기록</p>
      <p className={'mt-1 text-center text-6xl font-bold tabular-nums ' + (result.isNewRecord ? 'text-accent' : '')}>
        {formatSeconds(result.totalMs)}<span className="text-2xl">초</span>
      </p>
      <p className="mt-2 text-center text-sm text-mute tabular-nums">
        실제 {formatSeconds(result.actualMs)} + 페널티 {formatSeconds(result.penaltyMs)}
      </p>

      <div className="mt-6">
        <Mascot
          size={80}
          say={
            result.isNewRecord
              ? result.previousBestMs === null
                ? '첫 기록이에요. 다음엔 더 빨라질 거예요.'
                : `최고 기록 갱신! 이전 ${formatSeconds(result.previousBestMs)}초`
              : `최고 기록은 ${formatSeconds(result.previousBestMs ?? result.totalMs)}초. 조금만 더!`
          }
        />
      </div>

      {slow.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-mute">오래 걸린 글자</h2>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-paper">
            {slow.map((r) => (
              <li key={r.kanaId} className="flex items-center gap-4 px-4 py-3">
                <span lang="ja" className="w-10 text-3xl font-semibold">{kanaById(r.kanaId).char}</span>
                <span className="w-16 tabular-nums text-mute">{formatSeconds(r.elapsedMs)}초</span>
                <span lang="ja" className="flex-1 text-right text-sm text-mute">
                  {r.wrongTaps.length > 0
                    ? `${[...new Set(r.wrongTaps)].map((id) => kanaById(id).char).join(' ')} 오답`
                    : r.hintUsed
                      ? '힌트 사용'
                      : ''}
                </span>
              </li>
            ))}
          </ul>
          {result.missCount > 0 && <p className="mt-2 text-xs text-mute">다음 판에 이 글자들이 더 자주 나와요.</p>}
        </section>
      )}

      <div className="mt-auto flex gap-3 pt-10">
        <button type="button" onClick={onExit} className="rounded-2xl border border-line bg-paper px-5 py-4 font-semibold active:bg-sand">
          나가기
        </button>
        <button type="button" onClick={onRetry} className="flex-1 rounded-2xl bg-ink py-4 text-lg font-semibold text-paper active:scale-[0.99]">
          다시하기
        </button>
        {next && (
          <button type="button" onClick={() => onNext(next)} className="flex-1 rounded-2xl bg-accent py-4 text-lg font-semibold text-white active:scale-[0.99]">
            다음 단계
          </button>
        )}
      </div>
    </main>
  );
}
