# Notion 이미지 프록시 400 에러

> 작성일: 2026-01-19
> 관련 파일: `src/app/api/notion/image/route.ts`, `src/components/notion/blocks/image.tsx`

## 문제 상황

Notion 페이지에서 이미지를 불러올 때 400 Bad Request 에러 발생.

```
[GET] /api/notion/image?url=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F...
=> [400] Bad Request
```

### 증상
- 텍스트, 헤딩, 리스트 등 다른 블록은 정상 렌더링
- 이미지만 로드 실패
- 브라우저 네트워크 탭에서 400 응답 확인

---

## 분석

### 1. URL 인코딩 흐름 추적

**Notion S3 원본 URL 구조:**
```
https://prod-files-secure.s3.us-west-2.amazonaws.com/...?X-Amz-Credential=AKID%2F20250119%2F...
                                                                              ^^^^
                                                                              서명에 필요한 인코딩
```

S3 서명 URL의 `X-Amz-Credential` 파라미터에는 `%2F` (슬래시의 URL 인코딩)가 포함되어 있으며, 이 값은 **반드시 인코딩된 상태로 유지**되어야 함.

### 2. 클라이언트 코드 (image.tsx)

```typescript
// 프록시 URL 생성
const imageUrl = `/api/notion/image?url=${encodeURIComponent(originalUrl)}`;
```

`encodeURIComponent()`가 전체 URL을 인코딩:
- `%2F` → `%252F` (% 문자가 %25로 인코딩됨)
- `?` → `%3F`
- `=` → `%3D`

### 3. 서버 코드 (route.ts) - 문제 지점

```typescript
const imageUrl = searchParams.get("url");  // 1차 디코딩 (자동)
const decodedUrl = decodeURIComponent(imageUrl);  // 2차 디코딩 (문제!)
```

**흐름:**
1. `searchParams.get("url")`: `%252F` → `%2F` (정상)
2. `decodeURIComponent()`: `%2F` → `/` (서명 깨짐!)

### 4. 결론

이중 디코딩으로 인해 S3 서명에 필요한 `%2F`가 `/`로 변환되어 서명 검증 실패 → 400 에러.

---

## 해결

### 수정 코드

```typescript
// Before (문제)
let decodedUrl: string;
try {
  decodedUrl = decodeURIComponent(imageUrl);
} catch {
  return NextResponse.json({ error: "Invalid URL encoding" }, { status: 400 });
}

// After (해결)
// searchParams.get()은 이미 URL 디코딩을 수행함
// S3 서명 URL에 포함된 %2F 같은 인코딩은 유지되어야 하므로
// 추가적인 decodeURIComponent() 호출 금지
const decodedUrl = imageUrl;
```

### 핵심 포인트

| 메서드 | 디코딩 수행 |
|--------|------------|
| `searchParams.get()` | 자동으로 1회 디코딩 |
| `decodeURIComponent()` | 추가 디코딩 (불필요) |

`searchParams.get()`이 이미 URL 파라미터를 디코딩하므로, 별도의 `decodeURIComponent()` 호출은 불필요하며 오히려 문제를 일으킴.

---

## 검증

Playwright로 이미지 로딩 테스트:
- `.playwright-mcp/notion-images-test.png` - 결과 예시 탭 이미지
- `.playwright-mcp/notion-images-bonus-images.png` - 보너스 탭 이미지

모든 Notion 이미지 정상 로드 확인.

---

## 교훈

1. **URL 인코딩은 한 번만**: 클라이언트에서 인코딩 → 서버에서 자동 디코딩
2. **S3 서명 URL 주의**: 쿼리 파라미터의 인코딩된 문자는 유지 필요
3. **Web API 동작 이해**: `URLSearchParams.get()`은 자동 디코딩 수행
