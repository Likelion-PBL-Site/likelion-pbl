import { NextRequest, NextResponse } from "next/server";
import { fetchFreshVideoUrl } from "@/lib/notion-blocks";

/**
 * 허용된 Notion 미디어 도메인
 */
const ALLOWED_DOMAINS = [
  "prod-files-secure.s3.us-west-2.amazonaws.com",
  "s3.us-west-2.amazonaws.com",
];

/**
 * 비디오 URL로 페치 시도
 */
async function fetchVideo(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; NotionVideoProxy/1.0)",
    },
  });
}

/**
 * GET /api/notion/video
 * Notion 비디오 프록시 API
 *
 * Notion에 업로드된 비디오는 AWS S3 서명 URL로 제공되며,
 * 1시간 후 만료됩니다. 이 프록시를 통해 만료 문제를 해결합니다.
 *
 * Query Parameters:
 * - url: 인코딩된 Notion 비디오 URL
 * - blockId: (선택) Notion 블록 ID - URL 만료 시 새 URL 획득에 사용
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoUrl = searchParams.get("url");
  const blockId = searchParams.get("blockId");

  // URL 유효성 검사
  if (!videoUrl) {
    return NextResponse.json(
      { error: "Missing video URL parameter" },
      { status: 400 }
    );
  }

  const decodedUrl = videoUrl;

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
        error: "Invalid video source",
        message: "Only Notion S3 videos are allowed",
        hostname: parsedUrl.hostname,
      },
      { status: 403 }
    );
  }

  try {
    // 1차 비디오 페치 시도
    let response = await fetchVideo(decodedUrl);

    // 403 에러 + blockId 존재 시 → 새 URL로 재시도
    if (response.status === 403 && blockId) {
      console.log(`[Video Proxy] URL 만료, 새 URL 획득 시도: ${blockId}`);

      const freshUrl = await fetchFreshVideoUrl(blockId);
      if (freshUrl) {
        console.log(`[Video Proxy] 새 URL로 재시도 중...`);
        response = await fetchVideo(freshUrl);

        if (response.ok) {
          console.log(`[Video Proxy] 새 URL로 성공!`);
        }
      } else {
        console.warn(`[Video Proxy] 새 URL 획득 실패: ${blockId}`);
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Failed to fetch video",
          status: response.status,
          statusText: response.statusText,
        },
        { status: response.status }
      );
    }

    // Content-Type 확인
    const contentType = response.headers.get("Content-Type") || "video/mp4";

    // 비디오가 아닌 경우 거부
    if (!contentType.startsWith("video/") && !contentType.startsWith("application/octet-stream")) {
      return NextResponse.json(
        { error: "Response is not a video", contentType },
        { status: 400 }
      );
    }

    // 비디오 바이너리 가져오기
    const buffer = await response.arrayBuffer();

    // 프록시 응답 반환
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // 50분 캐시 + 10분 stale 허용
        "Cache-Control": "public, max-age=3000, stale-while-revalidate=600",
        "CDN-Cache-Control": "public, max-age=3000, stale-while-revalidate=600",
        "Vercel-CDN-Cache-Control": "public, max-age=3000, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Video proxy error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
