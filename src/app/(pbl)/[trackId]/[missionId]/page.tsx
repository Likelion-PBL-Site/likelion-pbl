import { notFound } from "next/navigation";
import { getMissionById } from "@/lib/mock-data";
import { isValidTrackId } from "@/data/tracks";
import { fetchMissionSections, extractRequirements } from "@/lib/notion-blocks";
import type { MissionSections } from "@/types/notion-blocks";
import type { Requirement } from "@/types/pbl";
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
  if (!isValidTrackId(trackId)) {
    notFound();
  }

  // 미션 데이터 가져오기
  const mission = await getMissionById(missionId);

  // 미션이 없거나 트랙이 일치하지 않으면 404
  if (!mission || mission.track !== trackId) {
    notFound();
  }

  // Notion 페이지 ID가 있으면 섹션 블록 데이터 가져오기
  let sections: MissionSections | null = null;
  let notionRequirements: Requirement[] = [];

  if (mission.notionPageId) {
    try {
      // missionId를 전달하여 JSON 캐시 우선 사용
      sections = await fetchMissionSections(mission.notionPageId, mission.id);

      // guidelines 섹션에서 요구사항 추출
      if (sections.guidelines.length > 0) {
        const extracted = extractRequirements(sections.guidelines);
        notionRequirements = extracted.map((req, index) => ({
          id: req.id,
          title: req.title,
          description: req.description,
          isRequired: req.isRequired,
          order: index + 1,
        }));
      }
    } catch (error) {
      console.error("Notion 섹션 데이터 가져오기 실패:", error);
      // 실패해도 계속 진행 (mock 데이터로 폴백)
    }
  }

  return (
    <MissionDetailClient
      mission={mission}
      trackId={trackId}
      sections={sections}
      notionRequirements={notionRequirements.length > 0 ? notionRequirements : undefined}
    />
  );
}
