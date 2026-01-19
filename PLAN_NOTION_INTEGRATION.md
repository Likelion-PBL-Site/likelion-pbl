# Notion 연동 통합 계획 (최종 확정)

## 1. 현황 분석

### 노션 커리큘럼 구조

```
PBL 커리큘럼
├── 기획 / 디자인 (2edffd33-6b70-8054-8a63-cf94ab9e7c85)
├── 프론트-react (2edffd33-6b70-808c-843c-db1950a1d816)
├── 백엔드 - Django (2edffd33-6b70-80f0-b2a7-ff34db97e405)
└── 백엔드-SpringBoot (2edffd33-6b70-805b-b7a8-e34acbd75e2d)
    ├── #1. Java Fundamentals (1~4주차)
    ├── #2. Spring Core (5~7주차)
    └── #3. JPA (8~10주차)
```

### 노션 미션 페이지 목차 (8개)

```
1. 미션 소개
2. 과제 목표
3. 최종 결과물
4. 목표 수행 시간
5. 기능 요구 사항
6. 결과 예시
7. 제약 사항
8. 보너스 과제
```

### 현재 앱 탭 (7개)

```
미션 소개 | 과제 목표 | 요구 사항 | 구현 지침 | 결과 예시 | 제약 사항 | 보너스
```

---

## 2. 목차 매핑 (확정)

| 앱 탭 | 노션 섹션 | 비고 |
|-------|----------|------|
| 미션 소개 | 1. 미션 소개 | |
| 과제 목표 | 2. 과제 목표 | |
| **최종 결과물** | 3. 최종 결과물 | **신규 탭 추가** |
| 구현 지침 | 5. 기능 요구 사항 | |
| 결과 예시 | 6. 결과 예시 | 이미지 포함 |
| 제약 사항 | 7. 제약 사항 | |
| 보너스 | 8. 보너스 과제 | |

### 목표 수행 시간
- **노션**: `4. 목표 수행 시간` 섹션에서 텍스트 추출
- **앱**: 미션 헤더 영역 (트랙/난이도 Badge 옆 Clock 아이콘)에 표시
- 현재 `estimatedTime` 필드로 이미 구현됨

### 최종 탭 구조 (7개)

```tsx
<TabsTrigger value="intro">미션 소개</TabsTrigger>
<TabsTrigger value="objective">과제 목표</TabsTrigger>
<TabsTrigger value="result">최종 결과물</TabsTrigger>     // 신규
<TabsTrigger value="guidelines">구현 지침</TabsTrigger>   // 요구 사항 탭 제거
<TabsTrigger value="example">결과 예시</TabsTrigger>
<TabsTrigger value="constraints">제약 사항</TabsTrigger>
<TabsTrigger value="bonus">보너스</TabsTrigger>
```

---

## 3. 트랙 구조 변경

### 현재 → 변경 후

```typescript
// 현재
type TrackType = "frontend" | "backend" | "design";

// 변경 후
type TrackType = "react" | "springboot" | "django" | "design";
```

### 트랙 정보

| ID | 이름 | Notion Page ID |
|----|------|----------------|
| react | 프론트엔드 (React) | 2edffd33-6b70-808c-843c-db1950a1d816 |
| springboot | 백엔드 (Spring Boot) | 2edffd33-6b70-805b-b7a8-e34acbd75e2d |
| django | 백엔드 (Django) | 2edffd33-6b70-80f0-b2a7-ff34db97e405 |
| design | 기획/디자인 | 2edffd33-6b70-8054-8a63-cf94ab9e7c85 |

---

## 4. 구현 계획

### Phase 1: 트랙 구조 변경

1. `src/types/pbl.ts` - TrackType 4개로 확장
2. `src/data/tracks.ts` 생성 - 트랙 정보 + Notion 페이지 ID
3. 관련 컴포넌트 업데이트 (tracks/page.tsx, [trackId]/page.tsx)

### Phase 2: 노션 블록 API

1. `src/types/notion-blocks.ts` - 블록 타입 정의
2. `src/lib/notion-blocks.ts` - 블록 조회 + 섹션 파싱 함수

### Phase 3: 이미지 프록시

1. `src/app/api/notion/image/route.ts` - Notion 이미지 URL 만료 대응

### Phase 4: 블록 렌더러

```
src/components/notion/
├── notion-block-renderer.tsx   # 메인 렌더러
├── notion-rich-text.tsx        # RichText (bold, italic, code 등)
└── blocks/
    ├── paragraph.tsx
    ├── heading.tsx
    ├── list.tsx
    ├── quote.tsx
    ├── callout.tsx
    ├── code.tsx          # Shiki 하이라이팅
    ├── image.tsx         # 프록시 URL 사용
    └── divider.tsx
```

### Phase 5: 페이지 통합

1. 트랙 목록 페이지 수정 (4개 트랙)
2. 트랙 상세 페이지 수정 (미션 목록)
3. 미션 상세 페이지 수정 (블록 렌더러 적용, 탭 7개)

---

## 5. 파일 변경 목록

### 신규 생성

| 파일 | 설명 |
|------|------|
| `src/types/notion-blocks.ts` | Notion 블록 타입 정의 |
| `src/data/tracks.ts` | 트랙 정보 + Notion 페이지 ID |
| `src/lib/notion-blocks.ts` | 블록 API 함수 |
| `src/app/api/notion/image/route.ts` | 이미지 프록시 |
| `src/components/notion/*.tsx` | 블록 렌더러 컴포넌트들 |

### 수정

| 파일 | 변경 내용 |
|------|----------|
| `src/types/pbl.ts` | TrackType 4개로 확장, Mission에 result 필드 추가 |
| `src/lib/mock-data.ts` | 트랙 데이터 분리, Notion 연동 로직 |
| `src/app/(pbl)/tracks/page.tsx` | 4개 트랙 표시 |
| `src/app/(pbl)/[trackId]/page.tsx` | 유효 트랙 검증 수정 |
| `src/app/(pbl)/[trackId]/[missionId]/page.tsx` | 블록 데이터 페칭 |
| `src/app/(pbl)/[trackId]/[missionId]/mission-detail-client.tsx` | 탭 7개 (요구사항→제거, 최종결과물→추가), 블록 렌더러 적용 |
| `package.json` | shiki 의존성 추가 |

---

## 6. 구현 순서

```
Step 1: 기반 구축
  ├── types/pbl.ts 수정 (TrackType 4개)
  ├── types/notion-blocks.ts 생성
  ├── data/tracks.ts 생성
  └── shiki 패키지 설치

Step 2: Notion API
  ├── lib/notion-blocks.ts 생성
  └── app/api/notion/image/route.ts 생성

Step 3: 블록 렌더러
  └── components/notion/* 생성

Step 4: 페이지 통합
  ├── tracks/page.tsx 수정
  ├── [trackId]/page.tsx 수정
  └── [trackId]/[missionId]/*.tsx 수정

Step 5: 테스트
  └── SpringBoot 1주차 미션으로 테스트
```

---

## 7. 미션 페이지 연결

현재 확인된 미션 페이지:
- SpringBoot 1주차: `2edffd33-6b70-80d8-9c6a-c761b6f718f2`

미션 목록은 트랙 페이지 내 toggle 블록에서 링크 추출 또는 수동 매핑 필요.

---

## 8. 구현 완료 상태 (2025-01)

### ✅ 완료된 항목

| Phase | 상태 | 비고 |
|-------|------|------|
| Phase 1: 트랙 구조 변경 | ✅ 완료 | 4개 트랙 (react, springboot, django, design) |
| Phase 2: 노션 블록 API | ✅ 완료 | 섹션 파싱 + JSON 캐시 |
| Phase 3: 이미지 프록시 | ✅ 완료 | `/api/notion/image` |
| Phase 4: 블록 렌더러 | ✅ 완료 | 모든 블록 타입 지원 |
| Phase 5: 페이지 통합 | ✅ 완료 | 7개 탭 구조 |

### 추가 구현 사항

1. **JSON 캐시 시스템**
   - `src/data/notion-cache/` - 미션별 캐시 파일
   - `scripts/sync-notion-cache.mjs` - CLI 동기화 스크립트
   - `src/app/api/notion/sync/route.ts` - API 동기화

2. **체크리스트 UI 개선**
   - 기존: 구현 지침 탭 사이드바에 체크리스트
   - 변경: 탭 상단 진행률 바 + 체크리스트 통합
   - 반응형: 데스크톱(Collapsible), 모바일(Bottom Sheet)

3. **컴포넌트 구조**
   ```
   src/components/mission/
   ├── index.ts
   ├── mission-checklist.tsx
   └── mission-progress-checklist.tsx
   ```

### 참고 문서

- `CLAUDE.md` - 프로젝트 가이드 (최신)
- `docs/NOTION_IMAGE_PROXY.md` - 이미지 프록시 설계
- `docs/troubleshooting/` - 트러블슈팅 기록
