const PREFERRED = ['Google 日本語', 'Microsoft Nanami', 'Kyoko'];

export function isSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** lang 이 ja 로 시작하는 음성 중 선호 순서대로 고른다. 없으면 null. */
export function pickJapaneseVoice(voices: SpeechSynthesisVoice[], preferURI?: string): SpeechSynthesisVoice | null {
  const ja = voices.filter((v) => v.lang.toLowerCase().startsWith('ja'));
  if (ja.length === 0) return null;
  if (preferURI) {
    const hit = ja.find((v) => v.voiceURI === preferURI);
    if (hit) return hit;
  }
  for (const name of PREFERRED) {
    const hit = ja.find((v) => v.name.includes(name));
    if (hit) return hit;
  }
  return ja[0];
}

/** iOS 는 목록이 늦게 온다. voiceschanged 뒤 다시 읽는다. */
export function getVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!isSupported()) return Promise.resolve([]);
  const now = window.speechSynthesis.getVoices();
  if (now.length > 0) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', done);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', done);
    setTimeout(done, 1500);
  });
}

/** 반드시 사용자 탭에서 부른다. 자동 재생은 iOS 에서 막힌다. */
export function speak(text: string, voice: SpeechSynthesisVoice | null, rate = 0.9): void {
  if (!isSupported()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  u.rate = rate;
  if (voice) u.voice = voice;
  synth.speak(u);
}
