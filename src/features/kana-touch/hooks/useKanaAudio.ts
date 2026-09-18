'use client';

import { useCallback, useEffect, useRef } from 'react';
import { getVoices, isSupported, pickJapaneseVoice, speak } from '@/lib/tts';

/**
 * 문자 음성. 음성 파일(/assets/audio/kana/{romaji}.mp3)이 아직 없어 브라우저 일본어 음성으로 읽는다.
 * 파일이 준비되면 이 훅만 바꾼다. 게임 시작 때 한 번 음성 목록을 받아 둔다(프리로드에 해당).
 */
export function useKanaAudio() {
  const voice = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!isSupported()) return;
    let alive = true;
    getVoices().then((list) => {
      if (alive) voice.current = pickJapaneseVoice(list);
    });
    return () => {
      alive = false;
    };
  }, []);

  const play = useCallback((char: string) => {
    speak(char, voice.current, 0.9);
  }, []);

  return { play };
}
