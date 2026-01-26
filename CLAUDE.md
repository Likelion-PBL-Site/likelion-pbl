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
│   ├── (pbl)/[trackId]/              # 트랙 페이지 (커리큘럼 표)
│   ├── guide/                         # 학습 가이드 페이지
│   ├── tracks/                        # 트랙 목록 페이지
│   ├── faq/                           # FAQ 페이지
│   ├── demo/                          # UI 데모 페이지 (curriculum, notion-ui 등)
│   └── api/notion/                    # Notion API (데이터, 이미지, 동기화)
├── components/
│   ├── ui/           # shadcn/ui 컴포넌트
│   ├── curriculum/   # 커리큘럼 표 (CurriculumTable)
│   ├── mission/      # 체크리스트, 진행률 컴포넌트
│   ├── layout/       # 레이아웃 컴포넌트 (사이드바, 네비게이션)
│   └── notion/       # Notion 블록 렌더러
│       └── blocks/   # 개별 블록 (heading, callout, code, image, toggle 등)
├── lib/
│   ├── notion.ts         # Notion API + unstable_cache
│   ├── notion-blocks.ts  # 블록 파싱 + JSON 캐시 로드
│   └── mock-data.ts      # Mock 데이터 + 데이터 접근 함수
├── store/            # Zustand (pbl-store, ui-store)
└── data/
    ├── tracks.ts        # 트랙 설정 + 단계별 색상
    └── notion-cache/    # JSON 캐시 파일 (자동 생성)

scripts/              # Notion 캐시 동기화 스크립트
docs/troubleshooting/ # 트러블슈팅 + AI 협업 기록

.github/workflows/    # GitHub Actions (Notion 캐시 자동 동기화)
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

### 캐싱 구조

| 대상 | 캐시 방식 | 유효 기간 | 위치 |
|------|----------|----------|------|
| 트랙 페이지 미션 목록 | `unstable_cache` | 1시간 | 서버 메모리 |
| 미션 상세 콘텐츠 | JSON 파일 캐시 | GitHub Actions로 갱신 | `src/data/notion-cache/` |

### 데이터 흐름

**트랙 페이지 (미션 목록):**
```
요청 → unstable_cache 확인 → (없으면) Notion DB 쿼리 → 캐시 저장
```

**미션 상세 페이지:**
```
요청 → JSON 캐시 확인 → (없으면) Notion API → 블록 렌더링 + 캐시 저장
```

### 캐시 동기화

**수동 동기화:**
```bash
node scripts/sync-notion-cache.mjs                    # 전체 동기화 (Notion DB에서 자동 조회)
node scripts/sync-notion-cache.mjs <미션ID 또는 페이지ID>  # 특정 미션만
```

**자동 동기화 (GitHub Actions):**
- 매일 오전 6시, 오후 6시 (KST) 자동 실행
- Notion DB에서 모든 미션을 자동으로 조회
- 변경사항 있으면 자동 커밋 → Vercel 배포
- GitHub Actions UI에서 수동 트리거 가능

### 새 미션 추가

Notion DB에 페이지를 추가하면 자동으로 동기화됩니다:
1. Notion에서 해당 트랙 DB에 새 페이지 생성
2. GitHub Actions가 다음 실행 시 자동 감지 및 캐싱
3. 즉시 반영이 필요하면: `node scripts/sync-notion-cache.mjs` 실행

---

## Notion 블록 렌더러

```tsx
import { NotionBlockRenderer } from "@/components/notion";

// 기본 사용
<NotionBlockRenderer blocks={sections.introduction} />

// 섹션별 리스트 스타일 적용 (sectionType prop)
<NotionBlockRenderer blocks={sections.guidelines} sectionType="guidelines" />
```

**지원 블록:** paragraph, heading, list, quote, callout, toggle, code, image, divider

**섹션별 리스트 스타일:**
- `guidelines`, `example` → 번호 리스트 (1. 2. 3.)
- 나머지 → 불릿 리스트 (●)

**UI 개선 사항:**
| 블록 | 스타일 |
|------|--------|
| heading_3 | "1. 제목" → 원형 번호 뱃지 |
| callout | 이모지 기반 (💡=Tip, ⚠️=주의, ⭐=보너스) |
| code | 파일명 헤더 + 라인 넘버 |
| image | 클릭 시 라이트박스 확대 |
| toggle | 카드 스타일 + 애니메이션 |

---

## 커리큘럼 표

트랙 페이지에 접이식 커리큘럼 표 표시:

```tsx
import { CurriculumTable } from "@/components/curriculum/curriculum-table";

<CurriculumTable
  trackId={trackId}
  missions={missions}
  defaultOpen={true}  // 기본 펼침 상태
/>
```

**표 컬럼:** 주차 | 미션 | 핵심 키워드 | 단계

---

## 트랙 및 단계 시스템

### 트랙 설정 (`src/data/tracks.ts`)

```tsx
import { trackStageColors, getTrackById, isValidTrackId } from "@/data/tracks";

// 트랙별 단계 배지 색상
<Badge className={trackStageColors[trackId]}>{mission.stage}</Badge>
```

### 단계(Stage) 필드
- Notion DB의 원본값을 그대로 사용 (예: Java, Spring Core, Web, React 등)
- 기존 `difficulty` 필드 대신 `stage: string` 사용
- 트랙별 고유 색상으로 배지 표시

| 트랙 | 색상 | 단계 예시 |
|------|------|----------|
| React | Sky | Web, JS, React, TypeScript, BaaS, Project |
| Spring Boot | Emerald | Java, Spring Core, JPA, Project |
| Django | Green | Python, Django, DRF, Project |
| Design | Violet | 문제 정의, 설계, 디자인, Project |

---

## Claude Code 명령어

| 명령어 | 설명 |
|--------|------|
| `/commit` | 이모지 컨벤셔널 커밋 |
| `/troubleshoot` | 트러블슈팅 문서 작성 |
| `/checkpoint` | 세션 진행 상황 저장 |
| `/update-claude-md` | CLAUDE.md 업데이트 |

### 컨텍스트 관리 워크플로우

Auto compact가 60%에서 트리거되도록 설정됨 (`.claude/settings.json`).

- **주요 작업 완료 시**: `/checkpoint`로 진행 상황 저장

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

**로컬 (.env.local):**
```env
NOTION_API_KEY=         # Notion Integration 키 (필수)
NOTION_DB_SPRINGBOOT=   # SpringBoot 트랙 DB ID
NOTION_DB_REACT=        # React 트랙 DB ID
NOTION_DB_DJANGO=       # Django 트랙 DB ID
NOTION_DB_DESIGN=       # Design 트랙 DB ID
NOTION_SYNC_SECRET=     # 동기화 API 시크릿
```

**GitHub Secrets (Actions용):**
| Secret | 용도 |
|--------|------|
| `NOTION_API_KEY` | GitHub Actions에서 Notion API 호출 |
| `NOTION_DB_*` | 트랙별 데이터베이스 ID |

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
| 007 | 트랙 페이지 UX 개선 |
| 008 | 이미지 로딩 스피너 + 여백 수정 |
| 009 | 트랙 페이지 Notion API 캐싱 |

상세: `docs/troubleshooting/` 폴더 참조

---

## 주요 의존성

- `@notionhq/client`: Notion API
- `shiki`: 코드 하이라이팅
- `zustand`: 상태 관리
- `next-themes`: 테마 전환
