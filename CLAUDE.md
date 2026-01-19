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
├── app/                    # App Router (페이지, 레이아웃)
├── components/
│   ├── ui/                 # shadcn/ui 원자 컴포넌트 (Radix UI 기반)
│   ├── common/             # 프로젝트 공통 컴포넌트 (Logo, ThemeToggle)
│   ├── layout/             # 레이아웃 컴포넌트 (Header, Footer, Container, Section)
│   └── providers/          # 컨텍스트 제공자 (ThemeProvider)
├── hooks/                  # 커스텀 훅 (useMediaQuery, useBreakpoint)
├── lib/
│   ├── utils.ts            # cn() 함수 (Tailwind 클래스 병합)
│   ├── notion.ts           # Notion API 연동 함수
│   ├── env.ts              # 환경 변수 관리
│   └── validations/        # Zod 스키마 (contact, login, signup)
├── store/                  # Zustand 상태 관리 (ui-store, pbl-store)
├── data/missions/          # 트랙별 미션 mock 데이터
├── config/                 # 사이트 설정 (site.ts: 메타데이터, 네비게이션)
└── types/                  # TypeScript 타입 정의
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
```

### 핵심 패턴

- **경로 별칭**: `@/*` → `./src/*`
- **shadcn/ui 설정**: components.json 참조, `new-york` 스타일
- **테마**: next-themes 기반 다크/라이트 모드, OKLch 컬러 시스템 (globals.css)
- **폼 처리**: React Hook Form + Zod 검증 조합
- **상태 관리**: Zustand (UI 상태, PBL 진행률)
- **반응형**: Mobile-first, Tailwind 브레이크포인트 (hooks/use-media-query.ts)

### 핵심 타입 (`src/types/pbl.ts`)

```typescript
type TrackType = "frontend" | "backend" | "design"
type DifficultyType = "beginner" | "intermediate" | "advanced"

interface Mission {
  id, title, description, track, difficulty,
  introduction, objective, requirements, guidelines,
  exampleUrl?, constraints, bonusTask
}

interface MissionProgress {
  missionId: string
  completedRequirements: string[]  // requirement id 배열
  isCompleted: boolean
  lastVisited: string              // ISO date string
}
```

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
page.tsx (서버)           → 파라미터 검증, 데이터 페칭, notFound() 처리
mission-detail-client.tsx (클라이언트) → Zustand 훅, 체크리스트 인터랙션
```

```tsx
// page.tsx 예시
const { trackId, missionId } = await params;
const mission = getMissionById(trackId, missionId);
if (!mission) notFound();
return <MissionDetailClient mission={mission} />;
```

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
NOTION_API_KEY=         # Notion API 키
NOTION_DATABASE_ID=     # Notion 데이터베이스 ID
```

환경 변수 관리: `src/lib/env.ts`

### 유틸리티 함수

- `cn()` (`lib/utils.ts`): Tailwind 클래스 병합 (clsx + tailwind-merge)
- `calculateProgress()` (`store/pbl-store.ts`): 미션 진행률 계산
- `trackLabels`, `difficultyLabels` (`types/pbl.ts`): 한글 라벨 매핑
