# 쇼츠말고 니혼고 · 설계서

작성 2026-09-18. 근거 문서: `docs/PLAN.md`(개발계획서). 7월의 Expo 기획서는 `docs/archive/`로 보관하고 이 설계가 대체한다.

원칙 세 가지.
1. tascoFlow(회사)와 계정·저장소·키를 완전히 분리한다.
2. 전부 무료 플랜으로 시작한다. 유료가 필요해지는 지점은 미리 표시해 둔다.
3. 서버 없이 시작하되, 3차(Supabase)로 갈 때 코드를 다시 쓰지 않게 경계선만 먼저 그린다.

---

## 1. 계정·자원 분리

| 자원 | tascoFlow(회사) | 쇼츠말고 니혼고(개인) |
|---|---|---|
| 로컬 폴더 | `C:\Users\garim\my-project` | `C:\Users\garim\kokoro-nihongo` |
| GitHub | `tascorpCSC/tascoFlow` · sks@tascorp.co.kr | `garimtotoro-man/nihongo` · garimtotoro@gmail.com |
| Vercel | 회사 팀 | 개인 계정(GitHub garimtotoro-man 으로 로그인) · Hobby 플랜 |
| Supabase | 회사 org | garimtotoro@gmail.com 로 새 org · Free 플랜 (3차에서 생성) |
| 환경변수 | `my-project/.env.local` | `kokoro-nihongo/.env.local` (서로 복사 금지) |
| Claude Code | my-project 에서 열기 | kokoro-nihongo 에서 열기 (CLAUDE.md·메모리 별도) |

분리를 지키는 장치.
- 저장소 로컬 git 설정에 개인 이메일이 박혀 있다(전역 설정 없음). 커밋 훅(`.githooks/pre-commit`)이 이메일에 `tascorp`가 들어가면 커밋을 막는다.
- 두 GitHub 계정이 같은 `github.com` 호스트를 쓰므로 자격 증명 관리자가 토큰을 섞을 수 있다. 이 저장소에만 `credential.useHttpPath=true`를 켜서 저장소 URL 단위로 토큰을 따로 저장한다. 첫 푸시 때 브라우저 로그인 창이 뜨면 **garimtotoro-man** 으로 로그인한다.
- Supabase CLI 토큰은 `npx supabase login` 대신 `.env.local`의 `SUPABASE_ACCESS_TOKEN`으로 넘긴다. 전역 로그인 파일을 만들지 않아 회사 프로젝트와 섞이지 않는다.
- Vercel CLI 를 쓸 땐 반드시 `vercel link --scope <개인 계정>`. 기본 스코프로 연결하지 않는다.

## 2. 기술 스택과 이유

| 층 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | Next.js 16 (App Router) + TypeScript | tascoFlow와 같은 버전이라 학습 비용 0. HTML 1개에서 시작하면 2차(팩·퀴즈·복습)에서 어차피 갈아엎게 된다. |
| 스타일 | Tailwind v4 | 동일 이유. |
| 배포 | Vercel Hobby | GitHub 푸시만 하면 배포. 무료. |
| 콘텐츠 | 저장소 안 JSON 파일 | 비개발자가 단어만 추가 가능. DB 없이 시작. |
| 진도 저장 | 1~2차 localStorage → 3차 Supabase | 어댑터 하나로 갈아탄다(6장). |
| 발음 | 브라우저 `speechSynthesis` (ja-JP) | 무료. 유료 TTS는 반응 보고 결정. |
| 설치감 | PWA(manifest + 홈 화면 추가) | 앱스토어 없이 폰 홈 화면에 아이콘. |
| 테스트 | Vitest | 콘텐츠 검증·피드 알고리즘 단위 테스트. |

계획서는 "HTML 파일 1개로 시작"이라 했지만, 이미 Next.js 를 다루고 있고 2차 기능이 정해져 있어 처음부터 Next.js 로 간다. 비용은 똑같이 0원이다. 다만 **정적 사이트로만** 만들고 서버 코드는 3차까지 쓰지 않는다.

## 3. 폴더 구조

```
kokoro-nihongo/
├─ CLAUDE.md                  ← 이 프로젝트 전용 규칙(분리·문구·콘텐츠)
├─ docs/                      ← PLAN.md, DESIGN.md(이 문서), archive/
├─ content/                   ← ★ 콘텐츠. 코드 아님. 여기만 고치면 단어가 늘어난다
│  ├─ packs.json              ← 팩 목록(id·이모지·이름·설명·무료 여부)
│  └─ cards/
│     ├─ travel.json          ← 주로 여행 팩인 카드(다른 팩 태그도 가능)
│     ├─ love.json
│     ├─ shopping.json
│     ├─ exam.json
│     └─ tips.json            ← 팁 카드(팩 무관)
├─ scripts/
│  └─ content-stats.mjs       ← 팩별 장수·종류 비율 출력
├─ public/                    ← manifest, 아이콘
└─ src/
   ├─ app/
   │  ├─ layout.tsx
   │  ├─ page.tsx             ← 홈(첫 방문엔 온보딩 → 이후 오늘 통계·시작 버튼·장르 칩·레벨)
   │  ├─ feed/page.tsx        ← 피드
   │  ├─ saved/page.tsx       ← 저장함
   │  ├─ review/page.tsx      ← 복습(2차)
   │  ├─ stats/page.tsx       ← 통계(3차)
   │  └─ settings/page.tsx
   ├─ components/
   │  ├─ feed/  Feed, FeedCard, WordCard, PhraseCard, TipCard, QuizCard, MeaningReveal
   │  ├─ packs/ PackChip, PackSheet
   │  ├─ Home.tsx             ← 홈 화면(온보딩 여부로 분기)
   │  ├─ Onboarding.tsx       ← 1단계 장르 칩 → 2단계 레벨 세그먼트
   │  ├─ Segment.tsx          ← 두세 값 중 하나 고르기
   │  ├─ TtsButton.tsx
   │  └─ ProgressBar.tsx
   ├─ lib/
   │  ├─ content.ts           ← JSON 로드 + 스키마 검증(zod)
   │  ├─ feed.ts              ← 피드 순서 만들기(5장)
   │  ├─ tts.ts               ← 일본어 음성 고르기·재생
   │  ├─ streak.ts            ← 날짜·스트릭 계산
   │  └─ store/
   │     ├─ types.ts          ← Progress 타입 + ProgressStore 인터페이스
   │     ├─ local.ts          ← localStorage 구현(1~2차)
   │     └─ supabase.ts       ← Supabase 구현(3차)
   └─ test/                   ← content.test.ts, feed.test.ts, store.test.ts(저장소·스트릭)
```

## 4. 데이터 모델

### 4-1. 콘텐츠 카드 (`content/cards/*.json`)

```ts
type CardType = 'word' | 'phrase' | 'tip';
type Level = 'N5' | 'N4';
type PackId = 'travel' | 'love' | 'shopping' | 'exam' | 'food' | 'business' | 'anime' | 'daily';

type Card = {
  id: string;            // 로마자 케밥. 예: "ikura-desu-ka". 전체에서 유일
  type: CardType;
  level: Level;          // N4 학습자는 N5+N4 를 본다
  packs: PackId[];       // 복수 가능. tip 은 빈 배열 허용
  category: string;      // 화면 뱃지. 예: "주문"
  jp: string;            // 표시용 일본어
  kana?: string;         // 읽기. word·phrase 필수, tip 생략 가능
  romaji?: string;       // word·phrase 필수
  ko?: string;           // 뜻(가려지는 부분). word·phrase 필수
  example_jp?: string;
  example_ko?: string;
  note?: string;         // tip 카드 본문 / 단어 카드의 한 줄 보충
};
```

검증 규칙(테스트로 강제): id 중복 없음, `packs`의 값은 `packs.json`에 있는 id, word·phrase 는 kana·romaji·ko 필수, tip 은 note 필수. 비율 목표 단어 50 · 표현 35 · 팁 15 는 `content-stats`가 숫자로만 보여 준다(강제하지 않음).

### 4-2. 팩 (`content/packs.json`)

```json
{ "id": "travel", "emoji": "🧳", "name": "여행", "desc": "길찾기·주문·긴급", "free": true, "order": 1 }
```

`free:false` 는 지금은 아무 효과가 없다. 4차 수익화 때 게이트로 쓴다.

### 4-3. 사용자 진도 (기기 저장, 3차에 서버로)

```ts
type Progress = {
  schemaVersion: 1;
  onboarded: boolean;
  level: Level;
  activePacks: PackId[];
  liked: string[];
  saved: string[];
  seen: Record<string, number>;      // cardId → 본 횟수
  recent: string[];                  // 최근 본 카드 id 100개(반복 억제용)
  daily: Record<string, DayStat>;    // 'YYYY-MM-DD' → 통계
  settings: { dailyGoal: number; ttsRate: number; voiceURI?: string };
};
type DayStat = { seen: number; revealed: number; quizCorrect: number; quizTotal: number };
```

스트릭은 저장하지 않고 `daily`에서 계산한다(어제까지 연속으로 `seen>0`인 날 수). 저장 키 `snn.progress.v1`. 스키마가 바뀌면 `schemaVersion`을 올리고 마이그레이션 함수를 둔다.

## 5. 피드 알고리즘 (`lib/feed.ts`)

입력: 전체 카드, Progress. 출력: 이번 세션 카드 20장.

1. **레벨 필터.** 사용자 레벨 이하만 남긴다.
2. **풀 나누기.** A = 활성 팩에 속한 카드, B = 나머지(팁 제외). 팁은 T.
3. **뽑기.** 14장은 A, 6장은 B(70:30). 팁이 아닌 카드만. `recent`에 있는 카드는 뒤로 밀고, `seen` 횟수가 적은 카드를 우선한다. 풀이 모자라면 반복 허용.
4. **리듬.** 7장마다 T 에서 팁 1장을 끼운다(약 15%). 팁이 연달아 오지 않게 한다.
5. **퀴즈(2차).** 8장 이상 본 뒤부터 5장마다 퀴즈 카드 1장. 문제는 이 세션에서 뜻을 열어 본 카드 중 하나, 오답 3개는 같은 type 의 다른 카드 뜻.
6. 세션이 끝나면 "오늘 20장 완료" 카드를 붙이고, 넘기면 새 세션을 만든다(무한 피드처럼 느껴진다).

순수 함수로 만들고 난수 시드를 인자로 받아 테스트가 가능하게 한다.

## 6. 저장소 어댑터

```ts
interface ProgressStore {
  load(): Promise<Progress>;
  save(p: Progress): Promise<void>;
}
```

- 1~2차: `LocalProgressStore`. 변경마다 즉시 저장(용량이 작아 부담 없음).
- 3차: `SupabaseProgressStore`. 로그인 전엔 Local 을 쓰고, 첫 로그인 때 로컬 진도를 서버로 올린 뒤(합집합) 서버를 기준으로 쓴다. 오프라인이면 Local 에 임시 저장하고 온라인 복귀 시 다시 올린다.
- 화면 코드는 `useProgress()` 훅만 쓰고 어느 구현인지 모르게 한다. 이 경계 덕분에 3차에 UI 를 건드리지 않는다.

## 7. 화면 설계

| 화면 | 내용 |
|---|---|
| 온보딩(첫 방문) | 1단계 "왜 배우나요?" 팩 칩 복수 선택 → 2단계 레벨 [처음이에요(N5) \| 조금 해봤어요(N4)] → 바로 피드 |
| 홈(피드) | 세로 스냅 스크롤(`scroll-snap-type: y mandatory`), 한 화면 한 장. 상단 진도 `3/20`, 현재 팩 칩(누르면 팩 시트). 카드 뜻은 가려져 있고 탭하면 열림. 우측 세로로 🔊 ♥ 🔖. |
| 팩 시트 | 아래에서 올라오는 시트. 팩 칩 복수 선택, 닫으면 다음 세션부터 반영. |
| 저장함 | 저장 카드 목록. 카드를 누르면 그 카드만 모아 피드로 다시 본다. 2차에서 [복습하기] 버튼 추가. |
| 복습(2차) | 저장 카드 플래시카드 → 4지선다. 결과는 `daily.quiz*`에 기록. |
| 통계(3차) | 주간 학습량, 스트릭, 뜻 열어본 비율, 팩별 저장률. |
| 설정 | 레벨·팩·일일 목표·음성·속도. 3차에 계정. |

색은 흰 톤이다. 배경 `#f6f5f1`, 카드 흰색, 글자 `#1b1b22`, 강조 코랄 `#e5484d` 하나만 쓴다. 어두운 배경은 쓰지 않는다.

컨트롤 규칙은 tascoFlow 와 같게 유지한다. 두세 값 중 고르는 건 세그먼트, 여러 개 켜고 끄는 건 칩, 실행은 동사 버튼. 라벨이 상태에 따라 바뀌는 단일 버튼은 만들지 않는다.

발음(`lib/tts.ts`): `lang`이 `ja`로 시작하는 음성 중 Google 日本語 · Microsoft Nanami · Kyoko 순으로 고른다. iOS 는 음성 목록이 늦게 오므로 `voiceschanged` 이벤트 뒤 다시 고른다. 재생은 반드시 사용자 탭에서 시작한다(자동 재생은 iOS 에서 막힌다). 일본어 음성이 없는 기기는 버튼에 "음성 없음"을 표시한다.

## 8. 3차 Supabase 스키마 (지금 만들지 않음, 경계만 정함)

콘텐츠는 계속 저장소 JSON 에 둔다. DB 에는 **사용자 데이터만** 올린다.

```sql
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  level text not null default 'N5',
  active_packs text[] not null default '{}',
  settings jsonb not null default '{}',
  created_at timestamptz default now()
);
create table user_cards (
  user_id uuid references auth.users on delete cascade,
  card_id text not null,
  liked boolean default false,
  saved boolean default false,
  seen_count int default 0,
  last_seen_at timestamptz,
  primary key (user_id, card_id)
);
create table daily_stats (
  user_id uuid references auth.users on delete cascade,
  day date not null,
  seen int default 0, revealed int default 0,
  quiz_correct int default 0, quiz_total int default 0,
  primary key (user_id, day)
);
-- 세 테이블 모두 RLS: auth.uid() = user_id (profiles 는 id)
```

로그인은 Google OAuth 를 1순위로 한다. Free 플랜 내장 메일은 시간당 발송 한도가 매우 낮아 매직링크만으로는 부족하다.

## 9. 무료 플랜 한도와 대응

| 서비스 | 무료 조건 | 부딪히는 지점 | 대응 |
|---|---|---|---|
| Vercel Hobby | 개인·비상업 용도 | 4-3 수익화(구독) 시작 시 약관 위반 | 결제를 붙이는 날 Pro 로 올린다. 그 전까진 해당 없음 |
| Supabase Free | org 당 활성 프로젝트 2개, 일주일 무요청 시 일시정지 | 사용자가 적을 때 프로젝트가 잠들어 첫 로그인이 느려짐 | 로컬 우선 설계라 앱은 멈추지 않음. GitHub Actions 로 매일 한 번 REST 를 찔러 깨어 있게 함 |
| Supabase Auth 메일 | 내장 SMTP 시간당 몇 통 | 매직링크 가입 폭주 | Google OAuth 우선 |
| 브라우저 TTS | 무제한 | 기기마다 음성 품질 차이 | 반응 좋으면 유료 TTS 를 "저장한 카드"에만 붙여 비용 제한 |
| GitHub Free | 공개·비공개 무제한 | 없음 | |

## 10. 배포·환경변수

- `main` 푸시 = 운영 배포. 작업은 브랜치에서 하고 PR 없이 바로 merge 해도 된다(혼자 개발).
- Vercel 프로젝트는 개인 계정(TOTORO · Hobby)에서 GitHub 저장소를 import 해 만들었다. 프레임워크 자동 감지, 설정 없음. 운영 주소 https://nihongo-nine-zeta.vercel.app (2026-09-18 첫 배포).
- 환경변수는 3차 전까지 없다. 3차: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 두 개만. `.env.example`에 이름만 두고 값은 Vercel 대시보드와 로컬 `.env.local`에만 넣는다.
- 문구 규칙: 한국어 문장에 em-dash 금지, 훈계·설명 과다 금지(tascoFlow 매뉴얼 규칙과 동일).

## 11. 로드맵 (완료 조건 기준)

| 단계 | 끝나면 이렇게 된다 | 핵심 파일 |
|---|---|---|
| **0. 뼈대** | `npm run dev`로 피드 5장이 폰에서 스와이프된다. 뜻 가림·탭 열기·발음·저장 동작. 첫 방문 온보딩(장르·레벨)과 홈 화면은 2단계에서 앞당겨 여기서 만들었다. | `lib/feed.ts`, `components/feed/*`, `store/local.ts`, `Home.tsx`, `Onboarding.tsx` |
| **1. 공개** | 카드 40장(여행 15·쇼핑 10·연애 8·시험 7 + 팁 6). 개인 Vercel 에 올라가 링크로 공유됨. PWA 홈 화면 추가 가능. | `content/cards/*.json`, `public/manifest.webmanifest` |
| **2. 테마팩** | 피드 안에서 팩 시트로 장르를 바꾼다(온보딩·홈의 장르 칩은 0단계에서 완료). | `PackSheet.tsx`, `feed.test.ts` |
| **3. 재미** | 스트릭·오늘 목표 카드, 저장함 → 플래시카드, 피드 안 퀴즈 카드. | `streak.ts`, `review/page.tsx`, `QuizCard.tsx` |
| **4. 콘텐츠 100+** | 팩별 20장 이상. `content-stats` 로 비율 확인. 주변 3명 피드백 반영. | `content/` |
| **5. 계정(필요할 때)** | Google 로그인, 기기 간 동기화, 통계 화면. Supabase Free 프로젝트 생성. | `store/supabase.ts`, `supabase/migrations/` |

각 단계 끝에 3명에게 써보게 하고 "어느 팩이 좋았나 / 어디서 지루했나"를 묻는다.

## 12. 지금 사용자가 직접 할 일 (콘솔 작업, 코드와 무관)

1. **GitHub**: garimtotoro-man 계정으로 로그인해 `kokoro-nihongo` 저장소를 만든다(비공개 권장). 로컬 remote 는 이미 그 주소를 보고 있다. 아직 원격에 저장소가 없어 `Repository not found`가 난다.
2. **Vercel**: 개인 계정이 없으면 GitHub garimtotoro-man 으로 가입한다. 1단계가 끝난 뒤 저장소를 import 한다. 회사 팀에 초대된 계정과 같은 계정이어도 되지만, 프로젝트는 반드시 **개인(Hobby) 스코프**에 만든다.
3. **Supabase**: 3차 전까지 만들지 않는다. 만들 때 garimtotoro@gmail.com 으로 새 org 를 만든다.

## 13. 남긴 결정

- 7월 기획의 SM-2(간격 반복)는 이번 계획에서 빼고, 2차 저장함 복습과 3차 통계로 대신한다. 사용자 반응이 "더 외우고 싶다"로 나오면 `user_cards`에 `next_review_at`를 더해 붙인다. 스키마상 추가만 하면 되게 열어 뒀다.
- 콘텐츠를 DB 로 옮기는 시점은 "프리미엄 팩을 잠가야 할 때"로 정한다. 그 전엔 JSON 이 더 빠르고 공짜다.
