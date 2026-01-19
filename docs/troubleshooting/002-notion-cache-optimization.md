# Notion API 캐싱으로 페이지 로딩 최적화

> 작성일: 2026-01-19
> 관련 파일: `src/lib/notion-blocks.ts`, `src/data/notion-cache/`, `scripts/sync-notion-cache.mjs`, `src/app/api/notion/sync/route.ts`
> 태그: #optimization #caching #notion #performance

## 배경 및 문제 상황

미션 상세 페이지 접속 시 Notion API를 매번 호출하여 페이지 로딩이 매우 느림.

### 증상
- 페이지 접속마다 ~20초의 로딩 시간 소요
- 재귀적 API 호출로 인한 다수의 네트워크 요청
- 동일 콘텐츠임에도 매번 새로 페칭
- 사용자 경험 저하

---

## AI 협업 흐름 (Prompting Log)

> Claude Code와의 대화를 통해 문제를 분석하고 최적의 해결책을 도출한 과정입니다.

### 1단계: 문제 정의

**User Prompt:**
> "이제 다음으로는 이 과제 페이지 들어갈때 마다 노션 페이지 api를 끌어오는거 같은데 렌더링 기간이 너무 길어...어떻게 최적화를 할 수 있을 지 생각해봐 그리고 해결방법을 생각해봐."

**AI Response:**
- 현재 코드(`notion-blocks.ts`)를 분석하여 병목 지점 파악
- 4가지 최적화 옵션 제시:
  1. `unstable_cache` (Next.js 내장 캐시)
  2. ISR + generateStaticParams
  3. JSON 파일 캐시
  4. 병렬 페칭 최적화

### 2단계: 해결 방안 탐색

**User Prompt:**
> "각각의 최적화 방식에 대해 설명해줘 간단하게"

**AI Response:**
- 각 방식의 장단점을 표로 정리
- 상황별 추천 조합 제시:
  - 빠른 적용 → `unstable_cache`
  - 최고 성능 → ISR
  - 변경 잦음 → 짧은 TTL 캐시
  - 변경 드묾 → JSON 파일 캐시

### 3단계: 상황 구체화

**User Prompt:**
> "지금은 테스트 중이라 노션이 자주 변경될 예정인데, 실배포에 들어가면 변경이 잦지는 않을거 같아. 이런 경우에는 어떻게 하면 좋을까?"

**AI Response:**
- 하이브리드 전략 제안: 개발 시 짧은 TTL, 배포 후 긴 TTL + 수동 갱신
- 환경 변수로 동작 분기 설명

### 4단계: 구현 방향 결정

**User Prompt:**
> "그러면 배포 서버는 코드를 다르게 구성한다는거야?"

**AI Response:**
- "아니요, 코드는 동일합니다. 환경 변수로 동작을 다르게 설정합니다."
- `NODE_ENV` 기반 분기 예시 코드 제시

**User Prompt:**
> "그러면 이 캐시는 유저별로 캐싱한다는거지?"

**AI Response:**
- 서버 캐시 vs 브라우저 캐시 차이 설명
- "모든 유저가 공유하는 서버 캐시"임을 명확히 설명
- 다이어그램으로 캐시 흐름 시각화

### 5단계: 최종 결정

**User Prompt:**
> "음 근데 실제로 배포 되고 나서는 거의 변경 없을거 같은데, 차라리 json형태로 저장하고 따로 업데이트 하는 api를 만드는건 어때"

**AI Response:**
- "좋은 생각이에요!" - 사용자 제안 수용
- JSON 정적 캐시 + 수동 동기화 API 구조 설계
- 장점 정리: 로딩 속도, API 호출 0회, 비용 절감, 안정성

### 6단계: 구현 및 검증

**User Prompt:**
> "그렇게 진행해봐"

**AI Response:**
- Todo 리스트로 작업 계획
- 5개 파일 생성/수정
- 동기화 스크립트 실행 및 테스트
- Playwright로 캐시 동작 검증

---

## 기술적 분석

### 원인/배경 분석

```
fetchMissionSections(pageId)
  └→ fetchPageBlocks(pageId)     // 재귀 함수
      └→ Notion API 호출
          └→ has_children이면 재귀 호출
              └→ 또 다른 API 호출...
```

- 블록 수에 비례한 N번의 API 호출
- 순차적 요청 (병렬화 없음)
- 캐싱 전무 → 매 방문마다 전체 재페칭

### 해결 접근 방식

**선택: JSON 파일 캐시 + 수동 동기화**

이유:
1. 배포 후 콘텐츠 변경이 드묾
2. 런타임 API 호출 완전 제거 → 최고 성능
3. 구현이 단순하고 예측 가능
4. Notion 장애 시에도 서비스 정상 운영

---

## 구현 내용

### 생성/수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/data/notion-cache/index.ts` | 캐시 읽기/쓰기 유틸리티 |
| `src/data/notion-cache/be-mission-1.json` | 동기화된 미션 데이터 (192KB) |
| `scripts/sync-notion-cache.mjs` | CLI 동기화 스크립트 |
| `src/app/api/notion/sync/route.ts` | HTTP 동기화 API |
| `src/lib/notion-blocks.ts` | JSON 캐시 우선 읽기 로직 추가 |
| `src/app/(pbl)/[trackId]/[missionId]/page.tsx` | missionId 파라미터 전달 |

### 핵심 코드

**캐시 우선 읽기 (notion-blocks.ts):**
```typescript
export async function fetchMissionSections(
  pageId: string,
  missionId?: string
): Promise<MissionSections> {
  // 1. JSON 캐시에서 읽기 시도
  if (missionId) {
    const cached = await readCache(missionId);
    if (cached?.sections) {
      console.log(`[Notion] 캐시에서 로드: ${missionId}`);
      return cached.sections;
    }
  }

  // 2. Notion API로 폴백
  console.log(`[Notion] API에서 로드: ${pageId}`);
  const blocks = await fetchPageBlocks(pageId);
  return parseBlocksToSections(blocks);
}
```

---

## 검증

### 테스트 방법
1. `node scripts/sync-notion-cache.mjs` 실행하여 캐시 생성
2. Playwright로 페이지 접속
3. 콘솔 로그 확인

### 결과
```
[Notion] 캐시에서 로드: be-mission-1
```

| 구분 | Before | After |
|------|--------|-------|
| 로딩 시간 | ~20초 | 즉시 |
| API 호출 | N회 (재귀) | 0회 |
| 네트워크 | 매번 페칭 | 파일 읽기 |

---

## 프롬프팅 인사이트

### 효과적이었던 프롬프트 패턴

1. **상황 맥락 제공**: "테스트 중이라 자주 변경, 배포 후에는 드묾" → AI가 하이브리드 전략 제안

2. **확인 질문**: "배포 서버는 코드를 다르게 구성?" → 오해 방지, 명확한 설명 유도

3. **대안 제시**: "차라리 JSON으로 저장하는건 어때" → 사용자 아이디어를 AI가 구체화

### 개선할 수 있는 점

- 처음부터 "변경 빈도가 낮다"는 정보를 주었다면 더 빠르게 JSON 캐시 방안에 도달했을 것
- 성능 수치(20초)를 먼저 언급했다면 문제 심각성이 더 명확했을 것

### AI 협업 팁

1. **점진적 구체화**: 큰 방향 → 세부 조건 → 최종 결정 순으로 대화
2. **이해 확인**: "~라는거지?" 식의 확인 질문으로 오해 방지
3. **역제안 활용**: AI 제안에 대한 대안을 제시하면 더 맞춤화된 솔루션 도출

---

## 교훈

### 기술적 교훈

1. **캐싱 전략은 사용 패턴에 따라**: 변경 빈도가 핵심 결정 요소
2. **정적 캐시의 강력함**: API 호출 0회 = 최고의 성능 + 안정성
3. **폴백 설계**: 캐시 미스 시 API 호출로 개발 편의성 유지

### AI 협업 교훈

1. **맥락 정보가 핵심**: 사용 환경, 제약 조건을 알려줘야 최적 솔루션 도출
2. **대화식 탐색**: 여러 옵션을 비교하며 점진적으로 결정
3. **확인과 역제안**: AI 제안을 그대로 수용하지 말고, 질문하고 대안 제시하기
