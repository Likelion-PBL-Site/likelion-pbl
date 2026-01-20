# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 개발 명령어

```bash
npm run dev      # 개발 서버 (http://localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 검사
```

## 아키텍처 개요

Next.js 16 App Router 기반. React 19, TypeScript strict, Tailwind CSS v4.

### 디렉토리 구조

```
src/
├── app/
│   ├── (pbl)/[trackId]/[missionId]/  # 미션 상세 페이지
│   ├── demo/                          # UI 데모 페이지
│   └── api/notion/                    # Notion API (데이터, 이미지, 동기화)
├── components/
│   ├── ui/           # shadcn/ui 컴포넌트
│   ├── mission/      # 체크리스트, 진행률 컴포넌트
│   └── notion/       # Notion 블록 렌더러
│       └── blocks/   # 개별 블록 (heading, callout, code, image, toggle 등)
├── lib/
│   ├── notion.ts         # Notion API
│   ├── notion-blocks.ts  # 블록 파싱 + 캐시 로드
│   └── mock-data.ts      # Mock 데이터
├── store/            # Zustand (pbl-store, ui-store)
└── data/notion-cache/  # JSON 캐시 파일

scripts/              # Notion 캐시 동기화 스크립트
docs/troubleshooting/ # 트러블슈팅 + AI 협업 기록

.claude/
├── agents/           # 커스텀 에이전트
└── commands/         # 슬래시 명령어 (/commit, /troubleshoot 등)
```

### 핵심 패턴

- **경로 별칭**: `@/*` → `./src/*`
- **테마**: next-themes (다크/라이트), OKLch 컬러
- **상태 관리**: Zustand + 로컬 스토리지 (진행률 저장)
- **반응형 훅**: `useBreakpoint()` (isSm, isMd, isLg, isXl, is2xl)

---

## Notion 연동

### 데이터 흐름

```
페이지 요청 → JSON 캐시 확인 → (없으면) Notion API → 블록 렌더링
```

### 캐시 동기화

```bash
node scripts/sync-notion-cache.mjs           # 전체 동기화
node scripts/sync-notion-cache.mjs be-mission-1  # 특정 미션만
```

### 등록된 미션

| 미션 ID | 제목 |
|---------|------|
| be-mission-1 | Java 기초 - 콘솔 입출력 |
| be-mission-2 | 객체지향 프로그래밍 I |

### 새 미션 추가

1. `src/lib/mock-data.ts` - 미션 객체 추가
2. `scripts/sync-notion-cache.mjs` - MISSIONS_WITH_NOTION 배열에 추가
3. `src/app/api/notion/sync/route.ts` - 동일하게 추가
4. `node scripts/sync-notion-cache.mjs [미션ID]` 실행

---

## Notion 블록 렌더러

```tsx
import { NotionBlockRenderer } from "@/components/notion";

<NotionBlockRenderer blocks={sections.introduction} />
```

**지원 블록:** paragraph, heading, list, quote, callout, toggle, code, image, divider

**UI 개선 사항:**
| 블록 | 스타일 |
|------|--------|
| heading_3 | "1. 제목" → 원형 번호 뱃지 |
| callout | 이모지 기반 (💡=Tip, ⚠️=주의, ⭐=보너스) |
| code | 파일명 헤더 + 라인 넘버 |
| image | 클릭 시 라이트박스 확대 |
| toggle | 카드 스타일 + 애니메이션 |

---

## Claude Code 명령어

| 명령어 | 설명 |
|--------|------|
| `/commit` | 이모지 컨벤셔널 커밋 |
| `/troubleshoot` | 트러블슈팅 문서 작성 |
| `/checkpoint` | 세션 진행 상황 저장 |
| `/update-claude-md` | CLAUDE.md 업데이트 |

---

## 커스텀 에이전트

### troubleshoot-writer (자동 실행)
**자동 실행 조건:**
- 버그 해결 완료
- 3개+ 파일 수정 기능 구현
- 시행착오 끝에 해결
- UI 개선 완료

### 기타 에이전트
- `notion-mission-sync`: Notion 미션 등록/동기화
- `code-reviewer-kr`: 한국어 코드 리뷰
- `nextjs-app-dev`: Next.js 구조 설계
- `git-flow-manager`: Git Flow 관리

---

## 환경 변수

```env
NOTION_API_KEY=         # Notion Integration 키 (필수)
NOTION_SYNC_SECRET=     # 동기화 API 시크릿
```

---

## 트러블슈팅 문서

| 번호 | 내용 |
|------|------|
| 001 | 이미지 프록시 400 에러 |
| 002 | Notion 캐시 최적화 |
| 003 | 체크리스트 UI 개선 |
| 004 | 이미지 URL 온디맨드 갱신 |
| 005 | 세션 체크포인트 기능 |
| 006 | Notion 블록 UI 리팩토링 |

상세: `docs/troubleshooting/` 폴더 참조

---

## 주요 의존성

- `@notionhq/client`: Notion API
- `shiki`: 코드 하이라이팅
- `zustand`: 상태 관리
- `next-themes`: 테마 전환
