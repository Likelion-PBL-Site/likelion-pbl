import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { writeCache, listCacheFiles, type CachedMissionData } from "@/data/notion-cache";
import type { NotionBlock, MissionSections, SectionKey } from "@/types/notion-blocks";

/**
 * 동기화할 미션 목록 (notionPageId가 있는 것만)
 * 새 미션 추가 시 여기에 등록
 */
const MISSIONS_WITH_NOTION: Array<{ missionId: string; notionPageId: string }> = [
  {
    missionId: "be-mission-1",
    notionPageId: "2edffd33-6b70-80d8-9c6a-c761b6f718f2",
  },
  {
    missionId: "be-mission-2",
    notionPageId: "2edffd33-6b70-80db-b1af-f0ac2765fb21",
  },
  // 추가 미션은 여기에 등록
];

/**
 * 섹션 매핑
 */
const SECTION_MAPPING: Record<string, SectionKey> = {
  "1. 미션 소개": "introduction",
  "2. 과제 목표": "objective",
  "3. 최종 결과물": "result",
  "4. 목표 수행 시간": "timeGoal",
  "5. 기능 요구 사항": "guidelines",
  "6. 결과 예시": "example",
  "7. 제약 사항": "constraints",
  "8. 보너스 과제": "bonus",
};

function getBlockPlainText(block: NotionBlock): string {
  const blockType = block.type;

  switch (blockType) {
    case "heading_1":
      return block.heading_1.rich_text.map((t) => t.plain_text).join("");
    case "heading_2":
      return block.heading_2.rich_text.map((t) => t.plain_text).join("");
    case "heading_3":
      return block.heading_3.rich_text.map((t) => t.plain_text).join("");
    case "paragraph":
      return block.paragraph.rich_text.map((t) => t.plain_text).join("");
    case "callout":
      return block.callout.rich_text.map((t) => t.plain_text).join("");
    default:
      return "";
  }
}

function findSectionKey(text: string): SectionKey | null {
  const trimmedText = text.trim();

  if (SECTION_MAPPING[trimmedText]) {
    return SECTION_MAPPING[trimmedText];
  }

  for (const [pattern, key] of Object.entries(SECTION_MAPPING)) {
    const normalizedPattern = pattern.replace(/\s+/g, "").toLowerCase();
    const normalizedText = trimmedText.replace(/\s+/g, "").toLowerCase();

    if (normalizedText.startsWith(normalizedPattern.split(".")[0] + ".")) {
      return key;
    }
  }

  return null;
}

async function fetchPageBlocks(client: Client, pageId: string): Promise<NotionBlock[]> {
  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;

  do {
    const response = await client.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const block of response.results) {
      if ("type" in block) {
        const blockWithChildren = block as BlockObjectResponse;

        if (blockWithChildren.has_children) {
          const children = await fetchPageBlocks(client, blockWithChildren.id);
          (blockWithChildren as NotionBlock & { children?: NotionBlock[] }).children = children;
        }

        blocks.push(blockWithChildren as unknown as NotionBlock);
      }
    }

    cursor = response.next_cursor ?? undefined;
  } while (cursor);

  return blocks;
}

function parseBlocksToSections(blocks: NotionBlock[]): MissionSections {
  const sections: MissionSections = {
    introduction: [],
    objective: [],
    result: [],
    timeGoal: [],
    guidelines: [],
    example: [],
    constraints: [],
    bonus: [],
  };

  let currentSection: SectionKey | null = null;

  for (const block of blocks) {
    if (block.type === "heading_3") {
      const text = getBlockPlainText(block);
      const sectionKey = findSectionKey(text);

      if (sectionKey) {
        currentSection = sectionKey;

        if ("children" in block && block.children && block.children.length > 0) {
          sections[currentSection].push(...block.children);
        }
        continue;
      }
    }

    if (block.type === "callout" && "children" in block && block.children) {
      for (const child of block.children) {
        if (child.type === "heading_3") {
          const text = getBlockPlainText(child);
          const sectionKey = findSectionKey(text);

          if (sectionKey) {
            currentSection = sectionKey;

            if ("children" in child && child.children && child.children.length > 0) {
              sections[currentSection].push(...child.children);
            } else {
              const remainingChildren = block.children.filter((c) => c.id !== child.id);
              if (remainingChildren.length > 0) {
                sections[currentSection].push(...remainingChildren);
              }
            }
            break;
          }
        }
      }
      continue;
    }

    if (currentSection) {
      sections[currentSection].push(block);
    }
  }

  return sections;
}

/**
 * POST /api/notion/sync
 *
 * Notion 데이터를 JSON 캐시로 동기화합니다.
 *
 * Headers:
 *   - x-sync-secret: 동기화 시크릿 키 (필수)
 *
 * Body (optional):
 *   - missionId: 특정 미션만 동기화 (없으면 전체)
 *
 * 환경 변수:
 *   - NOTION_API_KEY: Notion API 키
 *   - NOTION_SYNC_SECRET: 동기화 시크릿 키
 */
export async function POST(request: NextRequest) {
  // 시크릿 키 검증
  const secret = request.headers.get("x-sync-secret");
  const expectedSecret = process.env.NOTION_SYNC_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { error: "NOTION_SYNC_SECRET 환경 변수가 설정되지 않았습니다" },
      { status: 500 }
    );
  }

  if (secret !== expectedSecret) {
    return NextResponse.json(
      { error: "유효하지 않은 시크릿 키입니다" },
      { status: 401 }
    );
  }

  // Notion API 키 확인
  if (!process.env.NOTION_API_KEY) {
    return NextResponse.json(
      { error: "NOTION_API_KEY 환경 변수가 설정되지 않았습니다" },
      { status: 500 }
    );
  }

  // 요청 바디 파싱
  let missionId: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    missionId = body.missionId;
  } catch {
    // 빈 바디도 허용
  }

  // 동기화 대상 필터링
  const targets = missionId
    ? MISSIONS_WITH_NOTION.filter((m) => m.missionId === missionId)
    : MISSIONS_WITH_NOTION;

  if (targets.length === 0) {
    return NextResponse.json(
      { error: `미션을 찾을 수 없습니다: ${missionId}` },
      { status: 404 }
    );
  }

  const client = new Client({ auth: process.env.NOTION_API_KEY });
  const results: Array<{
    missionId: string;
    success: boolean;
    syncedAt?: string;
    error?: string;
  }> = [];

  // 동기화 실행
  for (const mission of targets) {
    try {
      const blocks = await fetchPageBlocks(client, mission.notionPageId);
      const sections = parseBlocksToSections(blocks);

      const cacheData: CachedMissionData = {
        missionId: mission.missionId,
        notionPageId: mission.notionPageId,
        sections,
        syncedAt: new Date().toISOString(),
      };

      await writeCache(cacheData);

      results.push({
        missionId: mission.missionId,
        success: true,
        syncedAt: cacheData.syncedAt,
      });
    } catch (error) {
      results.push({
        missionId: mission.missionId,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;

  return NextResponse.json({
    message: `동기화 완료: ${successCount}개 성공, ${failedCount}개 실패`,
    results,
  });
}

/**
 * GET /api/notion/sync
 *
 * 캐시 상태를 조회합니다.
 */
export async function GET() {
  try {
    const cachedMissions = await listCacheFiles();

    return NextResponse.json({
      cachedMissions,
      totalCached: cachedMissions.length,
      availableMissions: MISSIONS_WITH_NOTION.map((m) => m.missionId),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "캐시 상태 조회 실패", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
