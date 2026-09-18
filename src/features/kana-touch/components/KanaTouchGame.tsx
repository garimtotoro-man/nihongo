'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import Link from 'next/link';
import { Mascot } from '@/components/Mascot';
import { Segment } from '@/components/Segment';
import { generateBoard } from '../engine/boardGenerator';
import { currentTarget, gameReducer, initialState } from '../engine/gameReducer';
import { kanaById } from '../engine/kanaData';
import { buildResult, formatSeconds, HINT_DELAY_MS } from '../engine/scoring';
import type { GameMode, GameResult, Level } from '../engine/types';
import { weightDelta } from '../engine/weakQueue';
import { useGameTimer } from '../hooks/useGameTimer';
import { useKanaAudio } from '../hooks/useKanaAudio';
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter';
import { DEFAULT_SETTINGS, type KanaTouchSettings, type StorageAdapter } from '../storage/StorageAdapter';
import { GameBoard } from './GameBoard';
import { GameHeader } from './GameHeader';
import { ResultScreen } from './ResultScreen';

const MODES: { value: GameMode; label: string; hint: string }[] = [
  { value: 'hiragana', label: '히라가나', hint: 'あ→ん 순서대로' },
  { value: 'katakana', label: '가타카나', hint: 'ア→ン 순서대로' },
  { value: 'mixed', label: '섞어서', hint: '소리마다 한 글자' },
  { value: 'pair', label: '짝 맞추기', hint: 'あ→ア 이어서' },
  { value: 'dakuon', label: '탁음', hint: 'か→が 이어서' },
  { value: 'reverse', label: '거꾸로', hint: 'ん→あ' },
];

const LEVELS: { value: string; label: string; hint: string }[] = [
  { value: '1', label: '1단계', hint: '한 줄' },
  { value: '2', label: '2단계', hint: '두 줄' },
  { value: '3', label: '3단계', hint: '15자' },
  { value: 'challenge', label: '도전', hint: '전부' },
];

const toLevel = (v: string): Level => (v === 'challenge' ? 'challenge' : (Number(v) as 1 | 2 | 3));

type Phase = 'menu' | 'playing' | 'result';

export function KanaTouchGame({ storage }: { storage?: StorageAdapter }) {
  const store = useRef<StorageAdapter | null>(storage ?? null);
  if (!store.current) store.current = new LocalStorageAdapter();

  const [phase, setPhase] = useState<Phase>('menu');
  const [mode, setMode] = useState<GameMode>('hiragana');
  const [level, setLevel] = useState<Level>(1);
  const [settings, setSettings] = useState<KanaTouchSettings>(DEFAULT_SETTINGS);
  const [best, setBest] = useState<number | null>(null);
  const [columns, setColumns] = useState(3);
  const [result, setResult] = useState<GameResult | null>(null);
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { play } = useKanaAudio();
  const finishing = useRef(false);

  const elapsed = useGameTimer(state.startedAt, state.status === 'playing', state.lastCorrectAt);

  useEffect(() => {
    store.current!.getSettings().then(setSettings);
  }, []);

  useEffect(() => {
    let alive = true;
    store.current!.getBestRecord(mode, level).then((b) => alive && setBest(b));
    return () => { alive = false; };
  }, [mode, level, phase]);

  const start = useCallback(async (m: GameMode, l: Level) => {
    const weakWeights = await store.current!.getWeakWeights();
    const board = generateBoard({ mode: m, level: l, rng: Math.random, weakWeights });
    setColumns(board.columns);
    setMode(m);
    setLevel(l);
    setResult(null);
    finishing.current = false;
    dispatch({ type: 'START', mode: m, level: l, now: Date.now(), tiles: board.tiles, sequence: board.sequence });
    setPhase('playing');
  }, []);

  const onTap = useCallback((tileId: string) => {
    const tile = state.tiles.find((t) => t.tileId === tileId);
    if (!tile || tile.removed) return;
    if (tile.kanaId === currentTarget(state)) play(tile.char); // 정답만 소리. 오답은 조용히 흔들기만
    dispatch({ type: 'TAP', tileId, now: Date.now() });
  }, [state, play]);

  // 5초 헤매면 힌트
  useEffect(() => {
    if (state.status !== 'playing' || !settings.hints || state.hintVisible) return;
    const id = setTimeout(() => dispatch({ type: 'SHOW_HINT', now: Date.now() }), HINT_DELAY_MS);
    return () => clearTimeout(id);
  }, [state.status, state.currentIndex, state.hintVisible, settings.hints]);

  // 클리어 → 결과 저장
  useEffect(() => {
    if (state.status !== 'cleared' || finishing.current) return;
    finishing.current = true;
    (async () => {
      const s = store.current!;
      const [prevBest, history] = await Promise.all([s.getBestRecord(state.mode, state.level), s.getHistory()]);
      const r = buildResult(state, prevBest, new Date().toISOString());
      await s.saveResult(r);
      await s.updateWeakWeights(weightDelta(r, history));
      setResult(r);
      setPhase('result');
    })();
  }, [state]);

  const exit = () => {
    dispatch({ type: 'RESET' });
    setPhase('menu');
  };

  const toggleHints = (v: 'on' | 'off') => {
    const next = { ...settings, hints: v === 'on' };
    setSettings(next);
    void store.current!.saveSettings(next);
  };

  if (phase === 'result' && result) {
    return <ResultScreen result={result} onRetry={() => start(result.mode, result.level)} onNext={(l) => start(result.mode, l)} onExit={exit} />;
  }

  if (phase === 'playing') {
    const target = currentTarget(state);
    const showNext = level === 1 || level === 2;
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-8 pt-4">
        <GameHeader elapsedMs={elapsed} penaltyMs={state.penaltyMs} done={state.currentIndex} total={state.sequence.length} onExit={exit} />
        <div className={'mt-6 flex-1 ' + (level === 'challenge' ? 'overflow-y-auto' : 'flex items-center')}>
          <div className="w-full">
            <GameBoard state={state} columns={columns} onTap={onTap} />
          </div>
        </div>
        <footer className="mt-6 h-12 text-center">
          {showNext && target && (() => {
            const k = kanaById(target);
            const kindLabel =
              mode === 'dakuon' ? (k.kind === 'seion' ? '청음' : '탁음')
              : mode === 'pair' || mode === 'mixed' ? (k.kanaType === 'hiragana' ? '히라가나' : '가타카나')
              : null;
            return (
              <p className="text-mute">
                다음: <span className="text-2xl font-bold text-ink">{k.ko}</span>
                <span className="ml-1 text-sm">({k.romaji})</span>
                {kindLabel && <span className="ml-2 text-sm">· {kindLabel}</span>}
              </p>
            );
          })()}
        </footer>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-10 pt-10">
      <div className="flex items-center justify-between">
        <Link href="/" aria-label="홈으로" className="grid size-9 place-items-center rounded-full bg-ink/5 text-ink active:scale-95">←</Link>
        <p className="text-sm font-medium text-accent">あいうえお 터치</p>
        <span className="size-9" />
      </div>

      <div className="mt-6">
        <Mascot size={80} say="글자를 순서대로 눌러요. 헷갈리는 글자가 섞여 있으니 잘 보고!" />
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-mute">모드</h2>
        <div className="mt-3">
          <Segment<GameMode> label="모드" columns={2} value={mode} onChange={setMode} options={MODES} />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-mute">단계</h2>
        <div className="mt-3">
          <Segment label="단계" columns={4} value={String(level)} onChange={(v) => setLevel(toLevel(v))} options={LEVELS} />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-mute">힌트 <span className="font-normal">(5초 헤매면 정답이 빛나요, +3초)</span></h2>
        <div className="mt-3">
          <Segment<'on' | 'off'>
            label="힌트"
            value={settings.hints ? 'on' : 'off'}
            onChange={toggleHints}
            options={[{ value: 'on', label: '켬' }, { value: 'off', label: '끔' }]}
          />
        </div>
      </section>

      <div className="mt-auto pt-8">
        <p className="mb-3 text-center text-sm text-mute tabular-nums">
          {best === null ? '아직 기록이 없어요' : `최고 기록 ${formatSeconds(best)}초`}
        </p>
        <button type="button" onClick={() => start(mode, level)} className="w-full rounded-2xl bg-accent py-4 text-lg font-semibold text-white active:scale-[0.99]">
          시작
        </button>
      </div>
    </main>
  );
}
