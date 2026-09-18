# あいうえおタッチ — 구현 명세서

> 일본어 학습 앱 내 문자 학습 미니게임.
> 이 문서는 Claude Code에 그대로 투입해 구현을 진행하기 위한 명세서다.
> 단계별로 나누어 지시하고, 각 단계의 **완료 조건**을 충족한 뒤 다음 단계로 넘어간다.

---

## 0. 전제 조건 (구현 시작 전 확인)

기술 스택이 확정되지 않은 경우 아래 기본값을 사용한다. 기존 프로젝트에 편입하는 경우 해당 프로젝트 규칙을 우선한다.

| 항목 | 기본값 | 비고 |
|---|---|---|
| 언어 | TypeScript (strict) | `any` 금지 |
| 프레임워크 | React 18 + Vite | RN 편입 시 로직 레이어는 그대로 재사용 |
| 상태 관리 | `useReducer` + Context | 외부 상태 라이브러리 불필요 |
| 스타일 | CSS Modules 또는 Tailwind | 프로젝트 규칙 따름 |
| 저장소 | `localStorage` (1차) → 서버 API (4차) | 인터페이스로 추상화할 것 |
| 테스트 | Vitest | 게임 로직 레이어는 테스트 필수 |
| 음성 | HTMLAudioElement + 사전 프리로드 | Web Audio API는 과설계 |

**중요**: 게임 로직(`engine/`)은 UI 프레임워크에 의존하지 않는 순수 TypeScript로 작성한다. 추후 React Native 이식 및 단위 테스트를 위한 필수 조건이다.

---

## 1. 게임 개요

문자 타일이 무작위로 배치된 화면에서 오십음도 순서대로 터치하는 타임어택 게임.

- 정답 터치 → 타일 소멸 + 해당 문자 음성 재생
- 오답 터치 → 타일 진동 + 페널티 시간 가산 (음성 재생 안 함)
- 모든 정답 타일 제거 시 종료, 기록 저장

목표는 **문자의 반사적 인식**이다. 단순 타임어택이 아니라, 오답 로그를 축적해 약점 문자를 다음 판에 재출제하는 개인 맞춤 학습 루프를 포함한다.

---

## 2. 디렉터리 구조

```
src/features/kana-touch/
├── engine/                     # 순수 로직 (UI 의존 없음)
│   ├── types.ts
│   ├── kanaData.ts             # 문자 마스터 데이터
│   ├── boardGenerator.ts       # 타일 구성 생성
│   ├── gameReducer.ts          # 게임 상태 전이
│   ├── scoring.ts              # 시간·페널티 계산
│   └── weakQueue.ts            # 약점 문자 가중치
├── components/
│   ├── KanaTouchGame.tsx       # 컨테이너
│   ├── GameBoard.tsx           # 타일 그리드
│   ├── KanaTile.tsx            # 타일 1개
│   ├── GameHeader.tsx          # 타이머 / 진행도
│   └── ResultScreen.tsx        # 결과 화면
├── hooks/
│   ├── useGameTimer.ts
│   └── useKanaAudio.ts
├── storage/
│   ├── StorageAdapter.ts       # 인터페이스
│   └── LocalStorageAdapter.ts
└── __tests__/
```

---

## 3. 타입 정의

`engine/types.ts` — 아래 정의를 그대로 사용한다.

```ts
export type KanaType = 'hiragana' | 'katakana';

export type GameMode =
  | 'hiragana'   // 히라가나만 순서대로
  | 'katakana'   // 가타카나만 순서대로
  | 'mixed'      // 혼합, 소리당 1자만 출현
  | 'pair'       // 같은 소리를 히라가나→가타카나 순으로 연속 터치
  | 'dakuon'     // 청음→탁음 짝 터치
  | 'reverse';   // 역순

export type Level = 1 | 2 | 3 | 'challenge';

export interface KanaChar {
  id: string;            // 'hira_nu'
  char: string;          // 'ぬ'
  kanaType: KanaType;
  row: string;           // 'na'
  order: number;         // 오십음도 순번 (0-based)
  romaji: string;        // 'nu'
  audio: string;         // 'nu.mp3'
  pairId: string;        // 'kata_nu'
  confusable: string[];  // ['hira_me', 'hira_wa', 'hira_ne']
}

export interface Tile {
  tileId: string;        // 판 내 고유값 (동일 문자 중복 배치 대비)
  kanaId: string;
  char: string;
  isTarget: boolean;     // 정답 시퀀스 포함 여부
  targetIndex: number;   // 정답이면 순번, 미끼면 -1
  removed: boolean;
}

export interface TapRecord {
  kanaId: string;        // 눌렀어야 할 문자
  elapsedMs: number;     // 직전 정답 이후 경과 시간
  missCount: number;
  wrongTaps: string[];   // 잘못 누른 문자 id 목록
  hintUsed: boolean;
}

export interface GameState {
  mode: GameMode;
  level: Level;
  tiles: Tile[];
  sequence: string[];        // 정답 kanaId 순서
  currentIndex: number;
  startedAt: number | null;
  lastCorrectAt: number | null;
  penaltyMs: number;
  records: TapRecord[];
  status: 'idle' | 'playing' | 'cleared';
  hintVisible: boolean;
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
  playedAt: string;          // ISO8601
}
```

---

## 4. 게임 규칙

### 4.1 페널티

```
최종 기록 = 실제 소요 시간 + 페널티 합계

최초 오답        : +1000ms
동일 문자 재오답  : +2000ms
힌트 발동        : +3000ms
```

동일 문자 재오답 판정은 **현재 타깃 문자에 대한 누적 미스 횟수** 기준이다.
`missCount === 0` 이면 +1000, `missCount >= 1` 이면 +2000.

### 4.2 힌트

- 직전 정답 이후 **5000ms** 동안 정답 입력이 없으면 자동 발동
- 정답 타일이 서서히 발광, 발동 시점에 +3000ms 가산
- 한 문자당 1회만 가산 (계속 헤매도 중복 가산 없음)
- 설정에서 비활성화 가능

### 4.3 승리 조건

`currentIndex === sequence.length` 시 `status = 'cleared'`.

---

## 5. 모드별 시퀀스 생성 규칙

`boardGenerator.ts`에 구현한다.

| 모드 | 시퀀스 |
|---|---|
| `hiragana` | 선택된 히라가나를 `order` 오름차순 |
| `katakana` | 선택된 가타카나를 `order` 오름차순 |
| `mixed` | 소리별로 히라가나/가타카나 중 랜덤 1개 선택 후 `order` 오름차순 |
| `pair` | 각 소리마다 `[히라가나, 가타카나]` 2개를 연속 배치. 소리 단위는 `order` 오름차순 |
| `dakuon` | 각 소리마다 `[청음, 탁음]` 2개 연속 배치 (か→が, た→だ 등) |
| `reverse` | `hiragana` 시퀀스의 역순 |

**`pair` 모드가 핵심 모드다.** 오십음 순서만 암기한 사용자는 클리어할 수 없고, 문자 간 대응 관계를 알아야 진행 가능하다. 구현 우선순위를 높게 둔다.

---

## 6. 난이도 및 미끼 배치

### 6.1 단계별 구성

| Level | 정답 타일 | 미끼 타일 | 총 타일 | 그리드 |
|---|---|---|---|---|
| 1 | 5 (1개 행) | 4 | 9 | 3×3 |
| 2 | 10 (2개 행) | 6 | 16 | 4×4 |
| 3 | 15 (랜덤) | 9 | 24 | 4×6 |
| challenge | 46 (전체) | 0 | 46 | 스크롤 허용 |

`pair` / `dakuon` 모드는 정답 타일 수가 2배가 되므로 Level 1은 소리 3개(타일 6개) + 미끼 3개로 조정한다.

### 6.2 미끼 선정 규칙 — 랜덤 금지

미끼는 정답 문자의 `confusable` 배열에서 우선 선택한다. 부족분만 랜덤으로 채운다.

```ts
function pickDistractors(targets: KanaChar[], count: number): KanaChar[] {
  const targetIds = new Set(targets.map(t => t.id));
  const pool = targets
    .flatMap(t => t.confusable)
    .filter(id => !targetIds.has(id));

  const unique = shuffle([...new Set(pool)]);
  const picked = unique.slice(0, count);

  // 부족분은 동일 kanaType 전체에서 랜덤 보충
  return fillRemaining(picked, count, targets[0].kanaType, targetIds);
}
```

주요 혼동 쌍 (`kanaData.ts`의 `confusable`에 반드시 반영):

```
히라가나: ぬ/め/わ/ね/れ  は/ほ/ま  さ/き  る/ろ  い/り  こ/た  け/は
가타카나: シ/ツ/ミ  ソ/ン/リ  ク/ワ/タ  ク/ケ  ス/ヌ  チ/テ  フ/ワ
```

### 6.3 약점 문자 반영

`weakQueue.ts`에서 문자별 가중치를 누적 관리하고, 타깃 선정 시 가중치 상위 문자를 우선 편입한다.

```
가중치 += 오답 1회당 3점
가중치 += 반응 2000ms 초과 시 1점
가중치 -= 연속 2회 무오답 클리어 시 1점 (최소 0)
```

Level 3의 랜덤 15자 선정 시, 가중치 상위 문자를 최대 8자까지 우선 포함하고 나머지는 랜덤으로 채운다.

---

## 7. 리듀서 액션

`gameReducer.ts`에 구현한다. 시간 계산은 모두 리듀서 내부에서 처리하고, 컴포넌트는 `Date.now()`를 직접 다루지 않는다.

```ts
type GameAction =
  | { type: 'START'; mode: GameMode; level: Level; now: number }
  | { type: 'TAP'; tileId: string; now: number }
  | { type: 'SHOW_HINT'; now: number }
  | { type: 'RESET' };
```

### TAP 처리 로직

```
1. tile 조회. removed === true 이면 무시 (no-op)
2. tile.kanaId === sequence[currentIndex] 인가?
   YES:
     - 현재 TapRecord 확정 (elapsedMs = now - lastCorrectAt)
     - tile.removed = true
     - currentIndex += 1
     - lastCorrectAt = now
     - hintVisible = false
     - currentIndex === sequence.length 이면 status = 'cleared'
   NO:
     - 현재 TapRecord의 missCount += 1, wrongTaps.push(tile.kanaId)
     - penaltyMs += (missCount === 1 ? 1000 : 2000)
     - 타일은 제거하지 않음
```

**주의**: `pair` / `dakuon` 모드에서는 동일 문자가 시퀀스에 2회 등장하지 않으므로 `tileId` 단위로 판정하면 충분하다. 단 `challenge` 모드에서 같은 문자가 중복 배치될 경우를 대비해 판정은 항상 `tileId`가 아닌 `kanaId` 일치로 수행한다.

---

## 8. UI 명세

### 8.1 게임 화면

```
┌──────────────────────────────┐
│  [나가기]   00:12.4   3 / 5  │   ← GameHeader
├──────────────────────────────┤
│                              │
│    ぬ    め    わ            │
│                              │   ← GameBoard
│    ね    に    な            │
│                              │
│    の    れ    ぬ            │
│                              │
├──────────────────────────────┤
│  다음:  ぬ                   │   ← 다음 목표 문자 (Level 1~2만)
└──────────────────────────────┘
```

- 타이머는 `requestAnimationFrame` 기반, 0.1초 단위 표기
- "다음 목표 문자" 표시는 Level 1~2에서만. Level 3 이상은 숨김
- 타일 최소 터치 영역 **48×48px**, 간격 최소 **8px** (오조작 방지)

### 8.2 결과 화면

```
        16.4초
   실제 12.4 + 페널티 4.0

   최고 기록 갱신 (이전 18.1초)

   ── 오래 걸린 문자 ──
     ぬ   3.2초   (め 오답)
     ね   2.8초   (わ 오답)

   다음 판에 이 문자들이 더 자주 나옵니다

   [ 다시하기 ]  [ 다음 단계 ]
```

오답으로 눌린 문자를 함께 표시하는 것이 중요하다. "ぬ를 눌러야 할 때 め를 눌렀다"는 정보가 학습자에게 가장 직접적인 피드백이 된다.

---

## 9. 연출 및 사운드

| 이벤트 | 연출 | 사운드 |
|---|---|---|
| 정답 | 타일 scale 1→0, opacity 1→0, 150ms | 해당 문자 음성 |
| 오답 | 좌우 shake ±6px, 200ms | 낮은 톤 짧은 효과음 |
| 힌트 | 정답 타일 box-shadow 페이드인, 800ms | 없음 |
| 클리어 | 화면 전환 | 성공음 |
| 기록 갱신 | 기록 수치 강조 | 팡파레 |

**오답 연출은 의도적으로 약하게 만든다.** 적색 X, 큰 실패음, 화면 흔들림은 사용하지 않는다. 저연령·입문자 대상이므로 좌절 신호를 최소화한다.

음성 파일은 게임 시작 시 해당 판에 등장하는 문자만 프리로드한다.
`prefers-reduced-motion: reduce` 대응 필수 — 애니메이션을 즉시 전환으로 대체한다.

---

## 10. 저장소 인터페이스

1차에서는 `localStorage`로 구현하되, 4차 서버 연동을 위해 인터페이스로 추상화한다.

```ts
export interface StorageAdapter {
  getBestRecord(mode: GameMode, level: Level): Promise<number | null>;
  saveResult(result: GameResult): Promise<void>;
  getWeakWeights(): Promise<Record<string, number>>;
  updateWeakWeights(delta: Record<string, number>): Promise<void>;
}
```

localStorage 키 규칙: `kanaTouch:best:{mode}:{level}`, `kanaTouch:weak`, `kanaTouch:history`
히스토리는 최근 50판만 보관한다.

---

## 11. 구현 단계

각 단계 완료 후 동작을 확인하고 다음으로 진행한다.

### 1차 — 플레이 가능한 최소 구현

- [ ] `kanaData.ts` 작성 (히라가나 46자, `confusable` 포함)
- [ ] `types.ts`, `gameReducer.ts`, `scoring.ts` 구현
- [ ] `boardGenerator.ts` — `hiragana` 모드 / Level 1만
- [ ] `KanaTouchGame`, `GameBoard`, `KanaTile`, `GameHeader` 구현
- [ ] 타이머, 페널티, 클리어 판정 동작
- [ ] `LocalStorageAdapter` — 최고 기록 저장/조회
- [ ] `gameReducer` 단위 테스트

**완료 조건**: `hiragana` Level 1 한 판을 끝까지 플레이하고, 오답 시 페널티가 반영된 기록이 저장·갱신된다.

### 2차 — 모드 확장 및 결과 화면

- [ ] 가타카나 46자 데이터 추가
- [ ] `katakana` / `mixed` 모드
- [ ] Level 2, 3 구성
- [ ] `ResultScreen` — 헤맨 문자 및 오답 문자 표시
- [ ] 힌트 시스템
- [ ] 음성 재생 (`useKanaAudio`)

**완료 조건**: 3개 모드 × 3개 레벨이 모두 플레이 가능하고, 결과 화면에 문자별 소요 시간과 오답 내역이 표시된다.

### 3차 — 학습 루프 완성

- [ ] `pair` 모드
- [ ] `dakuon` 모드 (탁음·반탁음 데이터 추가)
- [ ] `weakQueue.ts` — 가중치 누적 및 출제 반영
- [ ] 모드 해금 조건 적용
- [ ] `weakQueue` 단위 테스트

**완료 조건**: 특정 문자를 반복해서 틀린 뒤 새 판을 시작하면 해당 문자가 우선 출제된다.

### 4차 — 정식 버전

- [ ] `reverse` 모드
- [ ] `challenge` (46자) + 별도 랭킹
- [ ] 서버 `StorageAdapter` 구현
- [ ] 약점 문자 데이터를 타 학습 콘텐츠와 공유

---

## 12. 구현 시 준수 사항

1. **`engine/` 내부에서 React import 금지.** 순수 함수와 타입만 존재해야 한다.
2. **시간 값은 항상 파라미터로 주입.** 리듀서 내부에서 `Date.now()`를 호출하지 않는다. 테스트 가능성을 위한 조건이다.
3. **미끼 문자를 랜덤으로 뽑지 않는다.** `confusable` 우선 규칙(6.2)을 반드시 지킨다. 이 게임의 학습 효과 대부분이 여기서 나온다.
4. **`wrongTaps` 기록을 누락하지 않는다.** 단순 미스 횟수가 아니라 "무엇을 잘못 눌렀는지"가 핵심 학습 데이터다.
5. **한자를 일절 사용하지 않는다.** UI 텍스트에도 마찬가지다.
6. **1판 목표 소요 시간은 15초.** 이 기준을 넘기는 구성은 재검토한다.

---

## 13. 알려진 리스크

| 리스크 | 대응 |
|---|---|
| 오십음 순서만 암기하면 문자를 못 읽어도 클리어 가능 | `pair` / `dakuon` / `reverse` 모드를 필수 진행 경로에 포함 (3차에서 반드시 구현) |
| 페널티 누적으로 저연령 사용자 좌절 | Level 1은 페널티 표기를 생략하고 클리어 여부만 표시하는 옵션 제공 |
| 타일 간격이 좁아 오조작 발생 | 최소 48×48px, 간격 8px 이상 확보. 필요 시 오조작 유예 구간(직전 정답 후 150ms 내 입력 무시) 검토 |
| 반복 플레이 시 흥미 저하 | 매판 타일 배치·미끼 구성 랜덤화, 약점 문자 기반 출제로 구성 변화 |

---

## 14. 필요 에셋

| 항목 | 수량 | 비고 |
|---|---|---|
| 문자 음성 | 92 (히라가나 46 + 가타카나 46) | 탁음·요음은 3차에서 추가 |
| 효과음 | 4 (오답 / 클리어 / 기록갱신 / 탭) | |
| 타일 UI | 1세트 | |

음성은 본 게임 외 모든 문자·어휘 콘텐츠에서 공용으로 사용하므로 초기에 품질을 확보한다.
파일명 규칙: `/assets/audio/kana/{romaji}.mp3` (예: `nu.mp3`)
