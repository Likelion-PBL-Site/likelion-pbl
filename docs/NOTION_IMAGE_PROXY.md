# Notion 이미지 프록시 가이드

## 1. 문제 상황

### 현상
Notion 페이지에 업로드한 이미지가 웹사이트에서 일정 시간 후 깨져서 보이지 않음.

### 증상
- 처음에는 이미지가 정상적으로 표시됨
- 약 1시간 후 이미지가 로드되지 않음 (403 Forbidden)
- 페이지 새로고침 후에도 동일한 문제 발생

---

## 2. 원인 파악

### Notion 이미지 URL 구조

Notion에 직접 업로드한 이미지는 AWS S3에 저장되며, **임시 서명된 URL**로 제공됩니다.

```
https://prod-files-secure.s3.us-west-2.amazonaws.com/
  {workspace-id}/{file-id}/image.png
  ?X-Amz-Algorithm=AWS4-HMAC-SHA256
  &X-Amz-Credential=...
  &X-Amz-Date=20260119T032027Z
  &X-Amz-Expires=3600          ← 만료 시간 (초)
  &X-Amz-Signature=...
```

### 핵심 파라미터
| 파라미터 | 값 | 의미 |
|---------|-----|------|
| `X-Amz-Expires` | 3600 | 3600초 = **1시간 후 만료** |
| `X-Amz-Date` | 20260119T032027Z | URL 생성 시점 |
| `X-Amz-Signature` | (해시값) | 인증 서명 |

### 이미지 타입별 동작

| 업로드 방식 | URL 타입 | 만료 여부 |
|------------|---------|----------|
| Notion에 직접 업로드 | `file` (S3) | ⚠️ **1시간 후 만료** |
| 외부 URL 삽입 | `external` | ✅ 만료 없음 |

---

## 3. 분석

### 선택 가능한 해결 방안

| 방안 | 설명 | 장점 | 단점 |
|------|------|------|------|
| **A. Next.js 프록시** | 서버에서 이미지 중계 | 추가 비용 없음, 구현 간단 | 서버 트래픽 발생 |
| **B. 외부 이미지 호스팅** | S3/Cloudinary 사용 | 안정적, CDN 지원 | 추가 비용, 별도 업로드 필요 |
| **C. 노션에 외부 URL 삽입** | 이미지를 외부 호스팅 후 URL 삽입 | 만료 문제 없음 | 노션에서 직접 업로드 불가 |
| **D. ISR + 재생성** | 빌드 시 이미지 URL 갱신 | SSG 최적화 | 실시간 업데이트 어려움 |

### 트래픽 분석 (프록시 방식)

```
예상 규모:
- 4개 트랙 × 10주차 = 40개 미션
- 미션당 평균 5개 이미지 = 200개 이미지
- 이미지 평균 크기: 200KB

동시 접속자별 예상 트래픽:
- 10명: ~50 요청/분 → 월 ~5GB
- 50명: ~250 요청/분 → 월 ~25GB
- 100명: ~500 요청/분 → 월 ~50GB

Vercel 무료 플랜: 월 100GB → 동시 50명 수준 커버 가능
```

### 선택: A. Next.js 프록시

**이유:**
1. 현재 규모(멋사 PBL)에서 트래픽 부담 적음
2. 추가 인프라/비용 불필요
3. 구현이 간단하고 유지보수 용이
4. 필요시 다른 방식으로 전환 쉬움

---

## 4. 해결 방안

### 4.1 아키텍처

```
[클라이언트]
     ↓ /api/notion/image?url=...
[Next.js API Route]
     ↓ fetch (서버에서 요청)
[Notion S3 이미지]
     ↓ 이미지 바이너리
[Next.js API Route]
     ↓ Response + Cache-Control
[클라이언트]
     ↓ 이미지 렌더링
[브라우저 캐시] (50분)
```

### 4.2 구현 코드

```typescript
// src/app/api/notion/image/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  // URL 유효성 검사
  if (!imageUrl) {
    return NextResponse.json(
      { error: "Missing image URL" },
      { status: 400 }
    );
  }

  // Notion S3 URL만 허용 (보안)
  if (!imageUrl.includes("prod-files-secure.s3") &&
      !imageUrl.includes("s3.us-west-2.amazonaws.com")) {
    return NextResponse.json(
      { error: "Invalid image source" },
      { status: 403 }
    );
  }

  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("Content-Type") || "image/png";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3000, stale-while-revalidate=600",
        // 50분 캐시 + 10분 stale 허용
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### 4.3 이미지 블록 렌더러

```tsx
// src/components/notion/blocks/image.tsx

interface NotionImageBlockProps {
  block: {
    image: {
      type: "file" | "external";
      file?: { url: string };
      external?: { url: string };
      caption: Array<{ plain_text: string }>;
    };
  };
}

export function NotionImageBlock({ block }: NotionImageBlockProps) {
  const { image } = block;

  // 이미지 URL 결정
  const originalUrl = image.type === "file"
    ? image.file?.url
    : image.external?.url;

  // file 타입이면 프록시 경유, external이면 직접 사용
  const src = image.type === "file"
    ? `/api/notion/image?url=${encodeURIComponent(originalUrl || "")}`
    : originalUrl;

  const caption = image.caption?.[0]?.plain_text || "";

  return (
    <figure className="my-4">
      <img
        src={src}
        alt={caption}
        className="rounded-lg max-w-full h-auto"
        loading="lazy"
      />
      {caption && (
        <figcaption className="text-sm text-muted-foreground text-center mt-2">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
```

### 4.4 캐싱 전략

| 레이어 | 캐시 시간 | 설정 |
|--------|----------|------|
| 브라우저 | 50분 | `max-age=3000` |
| CDN (Vercel) | 50분 | `s-maxage=3000` |
| Stale 허용 | +10분 | `stale-while-revalidate=600` |

**왜 50분?**
- Notion URL 만료: 60분
- 안전 마진: 10분
- 50분 캐시 후 재요청 시 새 URL로 갱신

---

## 5. 보안 고려사항

### URL 화이트리스트
```typescript
// Notion S3 도메인만 허용
const ALLOWED_DOMAINS = [
  "prod-files-secure.s3.us-west-2.amazonaws.com",
  "s3.us-west-2.amazonaws.com",
];

if (!ALLOWED_DOMAINS.some(domain => imageUrl.includes(domain))) {
  return NextResponse.json({ error: "Invalid source" }, { status: 403 });
}
```

### Rate Limiting (선택)
```typescript
// 필요시 rate limiting 추가
// vercel.json 또는 middleware에서 설정
```

---

## 6. 모니터링

### 확인 사항
- [ ] Vercel Analytics에서 `/api/notion/image` 트래픽 모니터링
- [ ] 월간 대역폭 사용량 확인
- [ ] 이미지 로드 실패율 확인

### 트래픽 초과 시 대응
1. **단기**: Vercel Pro 업그레이드 (월 $20, 1TB)
2. **장기**: Cloudinary/S3 + CloudFront 전환

---

## 7. 테스트 체크리스트

- [ ] Notion file 타입 이미지 로드 확인
- [ ] Notion external 타입 이미지 로드 확인
- [ ] 1시간 후에도 이미지 정상 표시 확인
- [ ] 잘못된 URL 요청 시 에러 처리 확인
- [ ] 캐시 헤더 정상 설정 확인

---

## 8. 향후 개선 방안

### 트래픽 증가 시
1. **이미지 최적화**: Next.js Image 컴포넌트 활용
2. **CDN 캐싱 강화**: Vercel Edge Config 활용
3. **외부 호스팅 전환**: Cloudinary 무료 플랜 (월 25GB)

### 대규모 전환 시
```
Notion → Cloudinary 자동 업로드 파이프라인
1. Notion Webhook으로 이미지 업로드 감지
2. Lambda/Vercel Function에서 Cloudinary 업로드
3. 영구 URL로 교체
```
