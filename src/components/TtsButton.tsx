'use client';

import { useEffect, useState } from 'react';
import { getVoices, isSupported, pickJapaneseVoice, speak } from '@/lib/tts';

type Props = { text: string; rate?: number; voiceURI?: string };

export function TtsButton({ text, rate = 0.9, voiceURI }: Props) {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'none'>('loading');

  useEffect(() => {
    if (!isSupported()) { setStatus('none'); return; }
    let alive = true;
    getVoices().then((list) => {
      if (!alive) return;
      const v = pickJapaneseVoice(list, voiceURI);
      setVoice(v);
      setStatus(v ? 'ok' : 'none');
    });
    return () => { alive = false; };
  }, [voiceURI]);

  if (status === 'none') {
    return (
      <span className="flex flex-col items-center gap-1 text-mute" aria-live="polite">
        <span className="grid size-12 place-items-center rounded-full bg-white/10 text-2xl opacity-50">🔊</span>
        <span className="text-[11px]">음성 없음</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => speak(text, voice, rate)}
      className="flex flex-col items-center gap-1 text-paper active:scale-95"
      aria-label="발음 듣기"
    >
      <span className="grid size-12 place-items-center rounded-full bg-white/10 text-2xl">🔊</span>
      <span className="text-[11px]">발음</span>
    </button>
  );
}
