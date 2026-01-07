import { notFound } from "next/navigation";
import { getMissionById } from "@/lib/mock-data";
import type { TrackType } from "@/types/pbl";
import { MissionDetailClient } from "./mission-detail-client";

interface MissionPageProps {
  params: Promise<{
    trackId: string;
    missionId: string;
  }>;
}

/**
 * 미션 상세 페이지 (서버 컴포넌트)
 * 데이터 검증 및 notFound 처리를 담당
 */
export default async function MissionPage({ params }: MissionPageProps) {
  const { trackId, missionId } = await params;

  // 유효한 트랙인지 확인
  const validTracks: TrackType[] = ["frontend", "backend", "design"];
  if (!validTracks.includes(trackId as TrackType)) {
    notFound();
  }

  // 미션 데이터 가져오기
  const mission = getMissionById(missionId);

  // 미션이 없거나 트랙이 일치하지 않으면 404
  if (!mission || mission.track !== trackId) {
    notFound();
  }

  return <MissionDetailClient mission={mission} trackId={trackId as TrackType} />;
}
