import { NextResponse } from "next/server";
import {
  isNotionConfigured,
  fetchMissionsFromNotion,
  fetchMissionsByTrackFromNotion,
  fetchMissionByIdFromNotion,
} from "@/lib/notion";
import { isValidTrackId } from "@/data/tracks";
import type { TrackType } from "@/types/pbl";

/**
 * GET /api/notion
 * 노션에서 미션 데이터 조회
 *
 * Query Parameters:
 * - track: 트랙별 필터 (react, springboot, django, design)
 * - id: 특정 미션 ID
 */
export async function GET(request: Request) {
  // 노션 설정 확인
  if (!isNotionConfigured()) {
    return NextResponse.json(
      {
        error: "노션이 설정되지 않았습니다.",
        message: "NOTION_API_KEY와 NOTION_DATABASE_ID 환경 변수를 설정해주세요.",
        configured: false,
      },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const track = searchParams.get("track") as TrackType | null;
  const missionId = searchParams.get("id");

  try {
    // 특정 미션 조회
    if (missionId) {
      const mission = await fetchMissionByIdFromNotion(missionId);

      if (!mission) {
        return NextResponse.json(
          { error: "미션을 찾을 수 없습니다.", id: missionId },
          { status: 404 }
        );
      }

      return NextResponse.json({ mission, configured: true });
    }

    // 트랙별 미션 목록 조회
    if (track) {
      if (!isValidTrackId(track)) {
        return NextResponse.json(
          { error: "유효하지 않은 트랙입니다.", track },
          { status: 400 }
        );
      }

      const missions = await fetchMissionsByTrackFromNotion(track);
      return NextResponse.json({ missions, track, configured: true });
    }

    // 전체 미션 목록 조회
    const missions = await fetchMissionsFromNotion();
    return NextResponse.json({ missions, configured: true });
  } catch (error) {
    console.error("노션 API 오류:", error);
    return NextResponse.json(
      {
        error: "노션 데이터 조회 중 오류가 발생했습니다.",
        message: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}
