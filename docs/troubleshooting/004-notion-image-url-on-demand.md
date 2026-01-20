# Notion 이미지 URL 만료 - 온디맨드 갱신 방식

> 작성일: 2026-01-19
> 관련 파일: `src/app/api/notion/image/route.ts`, `src/components/notion/blocks/image.tsx`, `src/lib/notion-blocks.ts`
> 태그: #troubleshooting #notion #image #cache #on-demand

## 배경 및 문제 상황

Notion API에서 가져온 데이터를 JSON 캐시로 저장하여 성능을 최적화했으나, 이미지 URL 만료 문제가 발생했다.

### 증상
- Notion S3 이미지 URL은 1시간 후 만료됨 (서명된 URL)
- JSON 캐시에 저장된 이미지 URL이 만료되면 403 에러 발생
- 이미지가 깨져서 표시됨 ("이미지를 불러올 수 없습니다")

### 캐시된 이미지 URL 예시
```json
{
  "type": "image",
  "image": {
    "type": "file",
    "file": {
      "url": "https://prod-files-secure.s3.us-west-2.amazonaws.com/.../image.png?X-Amz-...",
      "expiry_time": "2026-01-19T07:50:53.856Z"
    }
  }
}
```

---

## AI 협업 흐름 (Prompting Log)

### 1단계: 문제 정의
**User Prompt:**
> "url 세션 만료되는거 해결할려고 했었어. 그래서 온디맨스? 방식으로 하기로 했었음"

**AI Response:**
- 프로젝트 구조 파악 (Next.js + Notion API 연동)
- 관련 파일 탐색: `image/route.ts`, `image.tsx`, `notion-blocks.ts`
- 기존에 온디맨드 방식의 기본 구조가 이미 구현되어 있음을 확인

### 2단계: 해결 방안 탐색
**User Prompt:**
> "캐시된 JSON URL 만료 문제였어"

**AI Response:**
- 현재 구현된 온디맨드 흐름 분석:
  1. 이미지 컴포넌트에서 `blockId`를 프록시 URL에 포함
  2. 프록시 API에서 403 에러 시 Notion API로 새 URL 획득
- 두 가지 방향 제시:
  1. 현재 방식 유지 + 개선 (캐시된 URL 먼저 시도 → 403 시 갱신)
  2. 완전 온디맨드 (항상 Notion API에서 새 URL)

### 3단계: 구현 결정
**User Prompt:**
> "1번 방법이 좋은듯"

**AI Response:**
- 1번 방식 선택: 캐시된 URL 우선 사용 + 실패 시 온디맨드 갱신
- 이미 구현된 코드 검증 및 문서화 진행

---

## 기술적 분석

### 원인/배경 분석

1. **Notion S3 서명 URL 특성**
   - Notion 이미지는 AWS S3에 저장되며, 서명된 URL로 제공
   - 보안상 1시간 후 만료됨 (`expiry_time` 필드로 확인 가능)

2. **JSON 캐시의 한계**
   - 캐시 동기화 시점의 URL이 저장됨
   - 동기화 후 1시간이 지나면 URL 만료

3. **기존 이미지 프록시의 한계**
   - 프록시가 캐시된 URL을 그대로 사용
   - 만료된 URL로 S3 요청 시 403 에러 반환

### 해결 접근 방식

**온디맨드 URL 갱신 전략:**
1. 캐시된 URL로 먼저 시도 (대부분의 경우 빠르게 성공)
2. 403 에러 발생 시 `blockId`로 Notion API 호출하여 새 URL 획득
3. 새 URL로 재시도

이 방식의 장점:
- 캐시 성능 유지 (만료 전에는 빠른 응답)
- 만료 시에도 자동 복구 (사용자 경험 저하 없음)
- 캐시 재동기화 불필요 (Notion API 호출 최소화)

---

## 구현 내용

### 생성/수정된 파일
| 파일 | 변경 내용 |
|------|----------|
| `src/components/notion/blocks/image.tsx` | 프록시 URL에 `blockId` 파라미터 추가 |
| `src/app/api/notion/image/route.ts` | 403 에러 시 온디맨드 URL 갱신 로직 |
| `src/lib/notion-blocks.ts` | `fetchFreshImageUrl()` 함수 추가 |

### 핵심 코드

**1. 이미지 컴포넌트 - blockId 전달 (`image.tsx:26-35`)**
```tsx
// S3 이미지 + file 타입일 때만 blockId 전달 (URL 만료 시 갱신용)
const shouldIncludeBlockId = isNotionS3 && image.type === "file";
const proxyParams = new URLSearchParams({ url: originalUrl });
if (shouldIncludeBlockId) {
  proxyParams.set("blockId", block.id);
}

const imageUrl = isNotionS3
  ? `/api/notion/image?${proxyParams.toString()}`
  : originalUrl;
```

**2. 프록시 API - 온디맨드 갱신 (`route.ts:90-105`)**
```tsx
// 1차 이미지 페치 시도
let response = await fetchImage(decodedUrl);

// 403 에러 + blockId 존재 시 → 새 URL로 재시도
if (response.status === 403 && blockId) {
  console.log(`[Image Proxy] URL 만료, 새 URL 획득 시도: ${blockId}`);

  const freshUrl = await fetchFreshImageUrl(blockId);
  if (freshUrl) {
    console.log(`[Image Proxy] 새 URL로 재시도 중...`);
    response = await fetchImage(freshUrl);

    if (response.ok) {
      console.log(`[Image Proxy] 새 URL로 성공!`);
    }
  }
}
```

**3. Notion API로 새 URL 획득 (`notion-blocks.ts:258-287`)**
```tsx
export async function fetchFreshImageUrl(blockId: string): Promise<string | null> {
  try {
    const client = getNotionClient();
    const block = await client.blocks.retrieve({ block_id: blockId });

    if ("type" in block && block.type === "image") {
      const imageBlock = block as BlockObjectResponse & {
        image: {
          type: "file" | "external";
          file?: { url: string };
          external?: { url: string };
        };
      };

      if (imageBlock.image.type === "file" && imageBlock.image.file?.url) {
        return imageBlock.image.file.url;
      }
    }
    return null;
  } catch (error) {
    console.error(`[Image Refresh] 블록 조회 실패: ${blockId}`, error);
    return null;
  }
}
```

### 데이터 흐름

```
브라우저 요청
    ↓
<img src="/api/notion/image?url=만료된URL&blockId=xxx" />
    ↓
┌─────────────────────────────────────────┐
│ Proxy API (/api/notion/image)           │
│                                         │
│ 1. 캐시된 URL로 S3 요청                  │
│    ↓                                    │
│ 2. 403 에러 감지                         │
│    ↓                                    │
│ 3. blockId로 Notion API 호출            │
│    → blocks.retrieve(blockId)           │
│    ↓                                    │
│ 4. 새 URL 획득                          │
│    ↓                                    │
│ 5. 새 URL로 S3 재요청 → 성공            │
└─────────────────────────────────────────┘
    ↓
이미지 반환 (200 OK)
```

---

## 검증

### 테스트 방법
1. 개발 서버 실행: `npm run dev`
2. 미션 페이지 접속: `http://localhost:3000/springboot/be-mission-1`
3. 이미지 로딩 확인
4. (선택) 캐시 파일의 `expiry_time`이 과거인 경우 테스트

### 예상 로그 출력 (URL 만료 시)
```
[Image Proxy] URL 만료, 새 URL 획득 시도: 2edffd33-6b70-806e-891b-f804e53d5f0b
[Image Refresh] 새 URL 획득 성공: 2edffd33-6b70-806e-891b-f804e53d5f0b
[Image Proxy] 새 URL로 재시도 중...
[Image Proxy] 새 URL로 성공!
```

### 필수 환경 변수
```env
NOTION_API_KEY=secret_xxx  # 온디맨드 갱신에 필수
```

---

## 프롬프팅 인사이트

### 효과적이었던 프롬프트 패턴
- **컨텍스트 복구**: "이전에 ~하기로 했었음" → AI가 빠르게 상황 파악
- **간결한 문제 정의**: "캐시된 JSON URL 만료 문제였어" → 핵심 원인 명확화
- **선택지 결정**: "1번 방법이 좋은듯" → 빠른 방향 결정

### 개선할 수 있는 점
- 세션이 끊기기 전에 중간 진행 상황을 문서화해두면 좋음
- 복잡한 구현은 단계별로 커밋하여 진행 상황 저장

### AI 협업 팁
- 기존 코드가 이미 구현되어 있을 수 있으니, 새로 작성하기 전에 확인 요청
- 파일 경로를 명시하면 AI가 정확한 위치 파악 가능

---

## 교훈

### 기술적 교훈
1. **서명된 URL의 특성 이해**: S3 서명 URL은 보안상 만료 시간이 있음
2. **캐시 전략과 실시간 데이터의 균형**: 정적 데이터는 캐시, 동적 URL은 온디맨드
3. **Fallback 패턴**: 1차 시도 실패 시 대체 방법으로 자동 복구

### AI 협업 교훈
1. **이전 대화 컨텍스트 공유**: 세션이 끊겨도 핵심 키워드로 빠르게 복구 가능
2. **기존 구현 확인 우선**: AI에게 "이미 구현되어 있는지 확인해줘"라고 요청
3. **의사결정은 명확하게**: 선택지가 주어지면 번호로 간단히 결정

---

## 관련 문서
- [001-notion-image-proxy-400.md](./001-notion-image-proxy-400.md) - 이미지 프록시 초기 구현
- [002-notion-cache-optimization.md](./002-notion-cache-optimization.md) - JSON 캐시 최적화
