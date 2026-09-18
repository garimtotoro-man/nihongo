# 쇼츠말고 니혼고 (kokoro-nihongo)

개인 프로젝트. 회사 프로젝트 tascoFlow(`C:\Users\garim\my-project`)와 **무관**하며 어떤 자원도 공유하지 않는다.

## 분리 규칙 (가장 중요)
- GitHub `garimtotoro-man/nihongo`, 커밋 이메일 garimtotoro@gmail.com. `tascorp`가 들어간 이메일로 커밋하지 않는다(`.githooks/pre-commit`이 막는다).
- Vercel 은 개인 계정 Hobby 스코프. Supabase 는 garimtotoro@gmail.com 의 별도 org. 회사 Supabase 키·URL·토큰을 이 저장소에 쓰지 않는다.
- `my-project`의 파일·환경변수·메모리를 참조하거나 복사하지 않는다.
- 밖으로 나가는 동작(푸시·배포·외부 서비스 생성)은 실행 전 확인을 받는다.

## 설계 문서
- `docs/PLAN.md` 개발계획서(사용자 작성). `docs/DESIGN.md` 설계서. 구조·데이터·알고리즘 결정은 설계서를 따른다. 바꿀 땐 설계서도 같은 커밋에서 고친다.

## 스택
Next.js 16 App Router · TypeScript · Tailwind v4 · Vitest. 3차 전까지 서버 코드·환경변수 없음. `node_modules/next/dist/docs/`의 가이드를 먼저 읽고 코드를 쓴다.

## 콘텐츠 규칙
- 단어·표현·팁은 `content/` JSON 에만 둔다. 코드 안에 콘텐츠를 박지 않는다.
- 남의 교재·앱 문장을 그대로 옮기지 않는다. 예문은 짧은 대화체로 직접 쓴다.
- 카드 id 는 로마자 케밥(`ikura-desu-ka`). 중복 금지.

## 문구·컨트롤 규칙
- 한국어 문장에 em-dash(—) 금지. 훈계·설명 과다 금지.
- 두세 값 중 고르기는 세그먼트, 여러 개 켜고 끄기는 칩, 실행은 동사 버튼. 상태에 따라 라벨이 바뀌는 단일 버튼 금지.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
