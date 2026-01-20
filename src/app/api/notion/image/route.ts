import { NextRequest, NextResponse } from "next/server";
import { fetchFreshImageUrl } from "@/lib/notion-blocks";

/**
 * 허용된 Notion 이미지 도메인
 */
const ALLOWED_DOMAINS = [
  "prod-files-secure.s3.us-west-2.amazonaws.com",
  "s3.us-west-2.amazonaws.com",
];

/**
 * 이미지 URL로 페치 시도
 */
async function fetchImage(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; NotionImageProxy/1.0)",
    },
  });
}

/**
 * GET /api/notion/image
 * Notion 이미지 프록시 API
 *
 * Notion에 업로드된 이미지는 AWS S3 서명 URL로 제공되며,
 * 1시간 후 만료됩니다. 이 프록시를 통해 만료 문제를 해결합니다.
 *
 * Query Parameters:
 * - url: 인코딩된 Notion 이미지 URL
 * - blockId: (선택) Notion 블록 ID - URL 만료 시 새 URL 획득에 사용
 *
 * 캐시 전략:
 * - 브라우저/CDN: 50분 캐시 (Notion URL 만료 전)
 * - stale-while-revalidate: 10분 허용
 *
 * 온디맨드 URL 갱신:
 * - 403 에러 + blockId 존재 시 → Notion API로 새 URL 획득 후 재시도
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");
  const blockId = searchParams.get("blockId");

  // URL 유효성 검사
  if (!imageUrl) {
    return NextResponse.json(
      { error: "Missing image URL parameter" },
      { status: 400 }
    );
  }

  // searchParams.get()은 이미 URL 디코딩을 수행함
  // S3 서명 URL에 포함된 %2F 같은 인코딩은 유지되어야 하므로
  // 추가적인 decodeURIComponent() 호출 금지
  const decodedUrl = imageUrl;

  // URL 파싱 및 도메인 검증
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(decodedUrl);
  } catch {
    return NextResponse.json(
      { error: "Invalid URL format" },
      { status: 400 }
    );
  }

  // Notion S3 도메인만 허용 (보안)
  const isAllowedDomain = ALLOWED_DOMAINS.some(
    (domain) => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
  );

  if (!isAllowedDomain) {
    return NextResponse.json(
      {
        error: "Invalid image source",
        message: "Only Notion S3 images are allowed",
        hostname: parsedUrl.hostname,
      },
      { status: 403 }
    );
  }

  try {
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
      } else {
        console.warn(`[Image Proxy] 새 URL 획득 실패: ${blockId}`);
      }
    }

    if (!response.ok) {
      // S3 URL 만료 등의 오류
      return NextResponse.json(
        {
          error: "Failed to fetch image",
          status: response.status,
          statusText: response.statusText,
        },
        { status: response.status }
      );
    }

    // Content-Type 확인
    const contentType = response.headers.get("Content-Type") || "image/png";

    // 이미지가 아닌 경우 거부
    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Response is not an image", contentType },
        { status: 400 }
      );
    }

    // 이미지 바이너리 가져오기
    const buffer = await response.arrayBuffer();

    // 프록시 응답 반환
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // 50분 캐시 + 10분 stale 허용
        // Notion URL 만료(60분) 전에 갱신되도록 설정
        "Cache-Control": "public, max-age=3000, stale-while-revalidate=600",
        // CDN 캐시도 동일하게 설정
        "CDN-Cache-Control": "public, max-age=3000, stale-while-revalidate=600",
        // Vercel Edge 캐시
        "Vercel-CDN-Cache-Control": "public, max-age=3000, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
