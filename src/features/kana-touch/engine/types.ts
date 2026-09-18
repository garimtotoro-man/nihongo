// 순수 타입. React 를 import 하지 않는다.

export type KanaType = 'hiragana' | 'katakana';

export type GameMode =
  | 'hiragana' // 히라가나만 순서대로
  | 'katakana' // 가타카나만 순서대로
  | 'mixed' // 혼합, 소리당 1자만 출현
  | 'pair' // 같은 소리를 히라가나→가타카나 순으로 연속 터치
  | 'dakuon' // 청음→탁음 짝 터치
  | 'reverse'; // 역순

export type Level = 1 | 2 | 3 | 'challenge';

export type KanaKind = 'seion' | 'dakuon' | 'handakuon';

export interface KanaChar {
  id: string; // 'hira_nu'
  char: string; // 'ぬ'
  kanaType: KanaType;
  row: string; // 'na'
  order: number; // 오십음도 순번 (0-based). 탁음은 청음과 같은 순번
  romaji: string; // 'nu'
  ko: string; // 한글 발음 '누'. 화면의 "다음" 안내는 글자 대신 이것을 보인다
  audio: string; // 'nu.mp3'
  pairId: string; // 'kata_nu'
  confusable: string[]; // ['hira_me', 'hira_wa', 'hira_ne']
  kind: KanaKind; // 명세 확장: 탁음 모드용
  dakuonId?: string; // 청음이면 대응 탁음 id (か→が)
  seionId?: string; // 탁음·반탁음이면 대응 청음 id
}

export interface Tile {
  tileId: string; // 판 내 고유값 (동일 문자 중복 배치 대비)
  kanaId: string;
  char: string;
  isTarget: boolean; // 정답 시퀀스 포함 여부
  targetIndex: number; // 정답이면 순번, 미끼면 -1
  removed: boolean;
}

export interface TapRecord {
  kanaId: string; // 눌렀어야 할 문자
  elapsedMs: number; // 직전 정답 이후 경과 시간
  missCount: number;
  wrongTaps: string[]; // 잘못 누른 문자 id 목록
  hintUsed: boolean;
}

export interface GameState {
  mode: GameMode;
  level: Level;
  tiles: Tile[];
  sequence: string[]; // 정답 kanaId 순서
  currentIndex: number;
  startedAt: number | null;
  lastCorrectAt: number | null;
  penaltyMs: number;
  records: TapRecord[];
  status: 'idle' | 'playing' | 'cleared';
  hintVisible: boolean;
  lastWrongTileId: string | null; // 연출용: 마지막 오답 타일
  wrongTapCount: number; // 연출용: 오답마다 증가해 같은 타일 재흔들림 유도
}

export interface GameResult {
  mode: GameMode;
  level: Level;
  actualMs: number;
  penaltyMs: number;
  totalMs: number;
  missCount: number;
  records: TapRecord[];
  isNewRecord: boolean;
  previousBestMs: number | null;
  playedAt: string; // ISO8601
}

export type GameAction =
  | { type: 'START'; mode: GameMode; level: Level; now: number; tiles: Tile[]; sequence: string[] }
  | { type: 'TAP'; tileId: string; now: number }
  | { type: 'SHOW_HINT'; now: number }
  | { type: 'RESET' };

export type Rng = () => number;
