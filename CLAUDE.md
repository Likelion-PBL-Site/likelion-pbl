# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 개발 명령어

```bash
npm run dev      # 개발 서버 실행 (http://localhost:3000)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 실행
npm run lint     # ESLint 검사
```

## 아키텍처 개요

Next.js 16 App Router 기반 스타터킷. React 19, TypeScript strict 모드, Tailwind CSS v4 사용.

### 디렉토리 구조

```
src/
├── app/
│   ├── (pbl)/              # PBL 라우트 그룹
│   └── api/notion/
│       ├── route.ts        # 미션 데이터 API
│       ├── image/route.ts  # 이미지 프록시 API
│       └── sync/route.ts   # 캐시 동기화 API
├── components/
│   ├── ui/                 # shadcn/ui 원자 컴포넌트 (Radix UI 기반)
│   ├── common/             # 프로젝트 공통 컴포넌트 (Logo, ThemeToggle)
│   ├── layout/             # 레이아웃 컴포넌트 (Header, Footer, Container, Section)
│   ├── mission/            # 미션 관련 컴포넌트
│   │   ├── index.ts                   # 배럴 export
│   │   ├── mission-checklist.tsx      # 체크리스트 UI
│   │   └── mission-progress-checklist.tsx  # 진행률+체크리스트 통합
│   ├── notion/             # Notion 블록 렌더러 (블록 → React 컴포넌트)
│   │   ├── notion-block-renderer.tsx  # 메인 렌더러
│   │   ├── notion-rich-text.tsx       # RichText 렌더링
│   │   └── blocks/                    # 개별 블록 컴포넌트
│   └── providers/          # 컨텍스트 제공자 (ThemeProvider)
├── hooks/                  # 커스텀 훅 (useMediaQuery, useBreakpoint)
├── lib/
│   ├── utils.ts            # cn() 함수 (Tailwind 클래스 병합)
│   ├── notion.ts           # Notion 페이지/DB API
│   ├── notion-blocks.ts    # Notion 블록 API + 섹션 파싱 + 캐시 로드
│   ├── mock-data.ts        # Mock 미션 데이터
│   ├── env.ts              # 환경 변수 관리
│   └── validations/        # Zod 스키마 (contact, login, signup)
├── store/                  # Zustand 상태 관리 (ui-store, pbl-store)
├── data/
│   ├── missions/           # 트랙별 미션 mock 데이터
│   ├── tracks.ts           # 트랙 정보 + Notion 페이지 ID
│   └── notion-cache/       # JSON 캐시 파일 저장
│       ├── index.ts        # 캐시 유틸리티 (읽기/쓰기)
│       └── *.json          # 미션별 캐시 데이터
├── config/                 # 사이트 설정 (site.ts: 메타데이터, 네비게이션)
├── types/
│   ├── pbl.ts              # PBL 타입 정의
│   └── notion-blocks.ts    # Notion 블록 타입
scripts/                    # 테스트/유틸 스크립트
├── sync-notion-cache.mjs   # Notion → JSON 캐시 동기화
├── test-notion-blocks.mjs  # 블록 조회 테스트
├── test-notion-images.mjs  # 이미지 블록 탐색
├── test-block-structure.mjs # 블록 계층 구조 분석
└── test-sections-parsed.mjs # 섹션 파싱 검증
docs/
├── NOTION_IMAGE_PROXY.md   # 이미지 프록시 설계 문서
├── CLAUDE_MD_UPDATE.md     # CLAUDE.md 업데이트 가이드
└── troubleshooting/        # 트러블슈팅 + AI 협업 기록
    ├── 001-notion-image-proxy-400.md
    └── 002-notion-cache-optimization.md
.claude/                    # Claude Code 설정
├── agents/                 # 커스텀 에이전트 정의
│   ├── code-reviewer-kr.md # 한국어 코드 리뷰어
│   ├── nextjs-app-dev.md   # Next.js App Router 전문가
│   └── git-flow-manager.md # Git Flow 워크플로우 관리
├── commands/               # 슬래시 명령어
│   ├── git/commit.md       # /commit
│   ├── update-claude-md.md # /update-claude-md
│   └── troubleshoot.md     # /troubleshoot (AI 협업 흐름 포함)
└── hooks/                  # 훅 스크립트
    └── slack-notify.sh     # Slack 알림 (선택)
```

### 라우팅 구조

```
src/app/
├── (pbl)/                      # PBL 라우트 그룹 (별도 레이아웃)
│   ├── [trackId]/              # 트랙 상세 (동적)
│   │   └── [missionId]/        # 미션 상세 (동적)
│   ├── tracks/                 # 트랙 선택
│   ├── guide/                  # 학습 가이드
│   └── faq/                    # FAQ
├── demo/                       # 데모 페이지
└── api/notion/                 # Notion API 라우트
    ├── route.ts                # 미션 데이터
    ├── image/route.ts          # 이미지 프록시
    └── sync/route.ts           # 캐시 동기화
```

### 핵심 패턴

- **경로 별칭**: `@/*` → `./src/*`
- **shadcn/ui 설정**: components.json 참조, `new-york` 스타일
- **테마**: next-themes 기반 다크/라이트 모드, OKLch 컬러 시스템 (globals.css)
- **폼 처리**: React Hook Form + Zod 검증 조합
- **상태 관리**: Zustand (UI 상태, PBL 진행률)
- **반응형**: Mobile-first, Tailwind 브레이크포인트 (hooks/use-media-query.ts)
- **반응형 훅**: `useBreakpoint()` - Tailwind 브레이크포인트 감지 (isSm, isMd, isLg, isXl, is2xl)

### 핵심 타입 (`src/types/pbl.ts`)

```typescript
type TrackType = "react" | "springboot" | "django" | "design"
type DifficultyType = "beginner" | "intermediate" | "advanced"

interface Mission {
  id, title, description, track, difficulty,
  introduction, objective, result, requirements, guidelines,
  exampleUrl?, constraints, bonusTask, notionPageId?
}

interface MissionProgress {
  missionId: string
  completedRequirements: string[]  // requirement id 배열
  isCompleted: boolean
  lastVisited: string              // ISO date string
}
```

| 트랙 ID | 이름 | Notion Page ID |
|---------|------|----------------|
| react | 프론트엔드 (React) | 2edffd33-6b70-808c-... |
| springboot | 백엔드 (Spring Boot) | 2edffd33-6b70-805b-... |
| django | 백엔드 (Django) | 2edffd33-6b70-80f0-... |
| design | 기획/디자인 | 2edffd33-6b70-8054-... |

라벨 매핑: `trackLabels`, `difficultyLabels` 상수 활용

### 상태 관리 상세

**UI 스토어** (`store/ui-store.ts`)
- 모바일 메뉴, 사이드바 열림/닫힘 상태

**PBL 스토어** (`store/pbl-store.ts`)
- 로컬 스토리지 키: `likelion-pbl-storage`
- 주요 액션:
  - `toggleRequirement(missionId, requirementId)` - 요구사항 체크 토글
  - `visitMission(missionId)` - 미션 방문 기록
  - `resetMissionProgress(missionId)` - 특정 미션 초기화
  - `resetAllProgress()` - 전체 초기화
- 헬퍼: `calculateProgress(missionId, totalRequirements, missionProgress)`

### Server/Client 컴포넌트 분리

미션 상세 페이지 패턴 (`src/app/(pbl)/[trackId]/[missionId]/`):

```
page.tsx (서버)           → 파라미터 검증, 캐시/API 데이터 페칭
mission-detail-client.tsx (클라이언트) → Zustand 훅, 체크리스트 인터랙션, 탭 UI
```

```tsx
// page.tsx 예시
const { trackId, missionId } = await params;
const mission = await getMissionById(missionId);
if (!mission) notFound();

// Notion 페이지 ID가 있으면 섹션 블록 데이터 로드 (캐시 우선)
let sections: MissionSections | null = null;
if (mission.notionPageId) {
  sections = await fetchMissionSections(mission.notionPageId, mission.id);
}

return (
  <MissionDetailClient
    mission={mission}
    trackId={trackId}
    sections={sections}           // Notion 블록 데이터
    notionRequirements={...}      // 추출된 요구사항
  />
);
```

**MissionDetailClient Props:**
- `mission`: 미션 기본 정보 (mock 또는 Notion DB)
- `sections`: Notion 섹션별 블록 배열 (없으면 null → mock 텍스트 폴백)
- `notionRequirements`: Notion에서 추출한 요구사항 (없으면 mission.requirements 사용)

### 컴포넌트 추가

shadcn/ui 컴포넌트 추가 시:
```bash
npx shadcn@latest add [컴포넌트명]
```

### 주요 설정 파일

- `components.json`: shadcn/ui 설정
- `src/config/site.ts`: 사이트 메타데이터, 네비게이션, 푸터 링크
- `src/app/globals.css`: Tailwind v4 + CSS 변수 (테마 색상)

### 환경 변수

```env
NOTION_API_KEY=               # Notion Integration 키 (필수)
NOTION_DATABASE_ID=           # 미션 DB ID (선택)
NOTION_REQUIREMENTS_DB_ID=    # 요구사항 DB ID (선택)
NOTION_SYNC_SECRET=           # 동기화 API 시크릿 키
```

환경 변수 관리: `src/lib/env.ts`

**Notion Integration 설정**
1. https://notion.so/my-integrations 에서 Integration 생성
2. 연동할 페이지에서 Integration 연결 필수

---

## Notion 연동 및 캐싱

### 데이터 로딩 흐름

```
페이지 요청
    ↓
fetchMissionSections(pageId, missionId)
    ↓
┌─────────────────────────────┐
│ 1. JSON 캐시 확인            │
│    src/data/notion-cache/   │
│    {missionId}.json         │
└─────────────────────────────┘
    ↓ (캐시 없음)
┌─────────────────────────────┐
│ 2. Notion API 폴백          │
│    fetchPageBlocks()        │
└─────────────────────────────┘
```

### 캐시 동기화

**CLI로 동기화:**
```bash
# 모든 미션 동기화
node scripts/sync-notion-cache.mjs

# 특정 미션만 동기화
node scripts/sync-notion-cache.mjs be-mission-1
```

**API로 동기화:**
```bash
curl -X POST http://localhost:3000/api/notion/sync \
  -H "x-sync-secret: YOUR_NOTION_SYNC_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"missionId": "be-mission-1"}'
```

**캐시 상태 확인:**
```bash
curl http://localhost:3000/api/notion/sync
```

### 새 미션 추가 시

1. `scripts/sync-notion-cache.mjs`의 `MISSIONS_WITH_NOTION` 배열에 추가
2. `src/app/api/notion/sync/route.ts`의 `MISSIONS_WITH_NOTION` 배열에 추가
3. 동기화 실행: `node scripts/sync-notion-cache.mjs`

```javascript
{
  missionId: "새-미션-id",
  notionPageId: "notion-page-id",
}
```

### 이미지 처리

- Notion 이미지 URL은 1시간 후 만료됨 (S3 서명 URL)
- `/api/notion/image` 프록시로 해결
- 캐시: 50분 (`max-age=3000`)
- 상세: `docs/NOTION_IMAGE_PROXY.md` 참조

### 섹션 파싱 규칙

```
Notion 구조:
callout
└── heading_3 (토글 헤딩): "6. 결과 예시"
    ├── paragraph: "설명..."
    ├── image 🖼️           ← 문맥 순서 보존
    └── ...
```
- **토글 헤딩**: `heading_3.children`이 섹션 콘텐츠
- **일반 헤딩**: 형제 블록들이 섹션 콘텐츠
- 이미지는 설명 텍스트 바로 다음에 위치 (문맥 유지)

### API 라우트

**GET /api/notion**
- `?track=springboot`: 트랙별 미션 목록
- `?id={missionId}`: 미션 상세 (DB 속성)

**GET /api/notion/image**
- `?url={encodedUrl}`: Notion 이미지 프록시
- 허용 도메인: `prod-files-secure.s3.us-west-2.amazonaws.com`

**POST /api/notion/sync**
- Header: `x-sync-secret: {NOTION_SYNC_SECRET}`
- Body: `{"missionId": "optional-specific-mission"}`
- 캐시 동기화 실행

**GET /api/notion/sync**
- 캐시 상태 조회

### Notion 섹션 구조 (8개)

| 섹션 키 | Notion 헤딩 | UI 탭 |
|---------|-------------|-------|
| introduction | 1. 미션 소개 | 미션 소개 |
| objective | 2. 과제 목표 | 과제 목표 |
| result | 3. 최종 결과물 | 최종 결과물 |
| timeGoal | 4. 목표 수행 시간 | (과제 목표 탭 하단) |
| guidelines | 5. 기능 요구 사항 | 구현 지침 |
| example | 6. 결과 예시 | 결과 예시 |
| constraints | 7. 제약 사항 | 제약 사항 |
| bonus | 8. 보너스 과제 | 보너스 |

**UI 탭 구조** (7개 탭):
```
미션 소개 | 과제 목표 | 최종 결과물 | 구현 지침 | 결과 예시 | 제약 사항 | 보너스
```

**체크리스트 UI** (탭 상단 고정):
- 모든 탭에서 접근 가능한 진행률 바 + 체크리스트 통합 컴포넌트
- 데스크톱 (≥768px): Collapsible 아코디언
- 모바일 (<768px): Bottom Sheet

### 미션 컴포넌트

**체크리스트 컴포넌트** (`components/mission`):
```tsx
import { MissionProgressChecklist } from "@/components/mission";

// 진행률 바 + 체크리스트 통합 (반응형)
<MissionProgressChecklist
  requirements={requirements}
  completedRequirements={completedRequirements}
  progressPercent={progressPercent}
  onToggle={(reqId) => toggleRequirement(mission.id, reqId)}
/>
```

**개별 체크리스트** (필요 시):
```tsx
import { MissionChecklist } from "@/components/mission";

<MissionChecklist
  requirements={requirements}
  completedRequirements={completedRequirements}
  onToggle={onToggle}
  compact  // 2열 그리드 (데스크톱용)
/>
```

### Notion 블록 렌더러

**사용법** (`components/notion`):
```tsx
import { NotionBlockRenderer } from "@/components/notion";

// 섹션별 블록 렌더링
{sections?.introduction.length > 0 ? (
  <NotionBlockRenderer blocks={sections.introduction} />
) : (
  // mock 텍스트 폴백
  <p>{mission.introduction}</p>
)}
```

**지원 블록 타입:**
- paragraph, heading_1/2/3
- bulleted_list_item, numbered_list_item
- quote, callout, toggle
- code (Shiki 하이라이팅)
- image (프록시 URL 자동 변환)
- divider

---

## 유틸리티 함수 및 훅

- `cn()` (`lib/utils.ts`): Tailwind 클래스 병합 (clsx + tailwind-merge)
- `calculateProgress()` (`store/pbl-store.ts`): 미션 진행률 계산
- `extractRequirements()` (`lib/notion-blocks.ts`): guidelines 블록에서 체크리스트 추출
- `readCache()`, `writeCache()` (`data/notion-cache/index.ts`): JSON 캐시 읽기/쓰기
- `trackLabels`, `difficultyLabels` (`types/pbl.ts`): 한글 라벨 매핑

**반응형 훅** (`hooks/use-media-query.ts`):
```tsx
import { useBreakpoint } from "@/hooks/use-media-query";

const { isMd, isLg } = useBreakpoint();
// isMd: ≥768px, isLg: ≥1024px

// 반응형 컴포넌트 렌더링
if (isMd) {
  return <DesktopComponent />;
}
return <MobileComponent />;
```

---

## 개발 워크플로우

### Notion 캐시 동기화 (권장)

```bash
# 1. Notion 콘텐츠 수정 후
node scripts/sync-notion-cache.mjs

# 2. 개발 서버에서 확인
npm run dev
```

### Notion 연동 테스트

```bash
# 블록 파싱 테스트
node scripts/test-sections-parsed.mjs

# 개발 서버 실행 후 Playwright로 UI 테스트
npm run dev
# Playwright MCP로 http://localhost:3000/springboot/be-mission-1 접근
```

### Mock 데이터 ↔ Notion 전환

- `.env`에 `NOTION_API_KEY` 설정 + JSON 캐시 존재 시 → 캐시 데이터 사용
- 캐시 미존재 시 → Notion API 직접 호출
- API 키 미설정 시 → mock 데이터 폴백

---

## Claude Code 명령어

### /commit
이모지와 컨벤셔널 커밋 메시지로 커밋 생성.

### /troubleshoot
트러블슈팅 + AI 협업 흐름 문서화. `docs/troubleshooting/`에 저장.

포함 내용:
- 문제 상황 및 분석
- AI와의 대화 흐름 (Prompting Log)
- 기술적 해결 과정
- 프롬프팅 인사이트

### /update-claude-md
현재 프로젝트 분석 후 CLAUDE.md 업데이트.

---

## 주요 의존성

- `@notionhq/client`: Notion API 클라이언트
- `shiki`: 코드 블록 문법 하이라이팅 (Notion 코드 블록 렌더링용)
- `zustand`: 클라이언트 상태 관리 (진행률, UI 상태)
- `next-themes`: 다크/라이트 테마 전환
- `dotenv`: 환경 변수 로드 (스크립트용)

---

## 트러블슈팅 참고

| 문서 | 내용 |
|------|------|
| `docs/troubleshooting/001-*.md` | 이미지 프록시 400 에러 (URL 이중 디코딩) |
| `docs/troubleshooting/002-*.md` | Notion 캐시 최적화 (20초 → 즉시 로딩) |
| `docs/troubleshooting/003-*.md` | 체크리스트 UI 개선 (탭 상단 통합, 반응형) |
