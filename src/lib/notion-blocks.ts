import { Client } from "@notionhq/client";
import type {
  BlockObjectResponse,
  ListBlockChildrenResponse,
} from "@notionhq/client/build/src/api-endpoints";
import type {
  NotionBlock,
  MissionSections,
  SectionKey,
} from "@/types/notion-blocks";
import { readCache } from "@/data/notion-cache";

/**
 * Notion 클라이언트 생성
 */
function getNotionClient(): Client {
  if (!process.env.NOTION_API_KEY) {
    throw new Error("NOTION_API_KEY가 설정되지 않았습니다.");
  }
  return new Client({ auth: process.env.NOTION_API_KEY });
}

/**
 * 페이지의 모든 블록 가져오기 (페이지네이션 처리)
 */
export async function fetchPageBlocks(pageId: string): Promise<NotionBlock[]> {
  const client = getNotionClient();
  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;

  do {
    const response: ListBlockChildrenResponse = await client.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const block of response.results) {
      if ("type" in block) {
        const blockWithChildren = block as BlockObjectResponse;

        // 자식 블록이 있으면 재귀적으로 가져오기
        if (blockWithChildren.has_children) {
          const children = await fetchPageBlocks(blockWithChildren.id);
          (blockWithChildren as NotionBlock & { children?: NotionBlock[] }).children = children;
        }

        blocks.push(blockWithChildren as unknown as NotionBlock);
      }
    }

    cursor = response.next_cursor ?? undefined;
  } while (cursor);

  return blocks;
}

/**
 * 섹션 매핑 (Notion 헤딩 텍스트 → 섹션 키)
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

/**
 * 블록에서 plain text 추출
 */
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

/**
 * 섹션 키 찾기
 */
function findSectionKey(text: string): SectionKey | null {
  const trimmedText = text.trim();

  // 정확히 매핑된 텍스트 찾기
  if (SECTION_MAPPING[trimmedText]) {
    return SECTION_MAPPING[trimmedText];
  }

  // 숫자로 시작하는 패턴 매칭 (예: "1. 미션 소개" 또는 "1.미션 소개")
  for (const [pattern, key] of Object.entries(SECTION_MAPPING)) {
    const normalizedPattern = pattern.replace(/\s+/g, "").toLowerCase();
    const normalizedText = trimmedText.replace(/\s+/g, "").toLowerCase();

    if (normalizedText.startsWith(normalizedPattern.split(".")[0] + ".")) {
      return key;
    }
  }

  return null;
}

/**
 * 블록 배열을 섹션별로 파싱
 *
 * Notion 구조:
 * - callout 블록 안에 heading_3 (토글 헤딩)으로 섹션 구분
 * - 토글 헤딩인 경우: heading_3.children이 섹션 콘텐츠
 * - 일반 헤딩인 경우: heading_3의 형제들이 섹션 콘텐츠
 */
export function parseBlocksToSections(blocks: NotionBlock[]): MissionSections {
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
    // 최상위 Heading 3 블록으로 섹션 구분 (callout 외부)
    if (block.type === "heading_3") {
      const text = getBlockPlainText(block);
      const sectionKey = findSectionKey(text);

      if (sectionKey) {
        currentSection = sectionKey;

        // 토글 헤딩인 경우: children이 섹션 콘텐츠
        if ("children" in block && block.children && block.children.length > 0) {
          sections[currentSection].push(...block.children);
        }
        continue;
      }
    }

    // Callout 블록 내부의 Heading 3 확인
    if (block.type === "callout" && "children" in block && block.children) {
      for (const child of block.children) {
        if (child.type === "heading_3") {
          const text = getBlockPlainText(child);
          const sectionKey = findSectionKey(text);

          if (sectionKey) {
            currentSection = sectionKey;

            // 토글 헤딩인 경우: heading_3의 children이 섹션 콘텐츠
            if ("children" in child && child.children && child.children.length > 0) {
              sections[currentSection].push(...child.children);
            } else {
              // 일반 헤딩인 경우: callout의 나머지 자식들이 섹션 콘텐츠
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

    // 현재 섹션에 블록 추가
    if (currentSection) {
      sections[currentSection].push(block);
    }
  }

  return sections;
}

/**
 * 미션 페이지에서 섹션별 블록 가져오기
 *
 * 1. JSON 캐시에서 먼저 읽기 시도
 * 2. 캐시가 없으면 Notion API로 폴백
 *
 * @param pageId - Notion 페이지 ID
 * @param missionId - 미션 ID (캐시 조회용, 선택적)
 */
export async function fetchMissionSections(
  pageId: string,
  missionId?: string
): Promise<MissionSections> {
  // 1. JSON 캐시에서 읽기 시도
  if (missionId) {
    try {
      const cached = await readCache(missionId);
      if (cached && cached.sections) {
        console.log(`[Notion] 캐시에서 로드: ${missionId}`);
        return cached.sections;
      }
    } catch (error) {
      console.warn(`[Notion] 캐시 읽기 실패: ${missionId}`, error);
    }
  }

  // 2. Notion API로 폴백
  console.log(`[Notion] API에서 로드: ${pageId}`);
  const blocks = await fetchPageBlocks(pageId);
  return parseBlocksToSections(blocks);
}

/**
 * 특정 섹션의 블록만 가져오기
 */
export async function fetchMissionSection(
  pageId: string,
  sectionKey: SectionKey
): Promise<NotionBlock[]> {
  const sections = await fetchMissionSections(pageId);
  return sections[sectionKey];
}

/**
 * 목표 수행 시간 텍스트 추출
 */
export function extractTimeGoalText(blocks: NotionBlock[]): string {
  for (const block of blocks) {
    if (block.type === "paragraph") {
      const text = getBlockPlainText(block);
      if (text.trim()) {
        return text.trim();
      }
    }
  }
  return "";
}

/**
 * 이미지 블록에서 URL 추출
 */
export function extractImageUrls(blocks: NotionBlock[]): string[] {
  const urls: string[] = [];

  for (const block of blocks) {
    if (block.type === "image") {
      const imageUrl = block.image.type === "file"
        ? block.image.file?.url
        : block.image.external?.url;

      if (imageUrl) {
        urls.push(imageUrl);
      }
    }

    // 자식 블록에서도 이미지 찾기
    if ("children" in block && block.children) {
      urls.push(...extractImageUrls(block.children as NotionBlock[]));
    }
  }

  return urls;
}

/**
 * 체크리스트용 요구사항 타입
 */
export interface ExtractedRequirement {
  id: string;
  title: string;
  description?: string;
  isRequired: boolean;
  category?: string; // heading_3로 분류된 카테고리
}

/**
 * guidelines 섹션에서 체크리스트 요구사항 추출
 * bulleted_list_item을 체크 가능한 요구사항으로 변환
 */
export function extractRequirements(blocks: NotionBlock[]): ExtractedRequirement[] {
  const requirements: ExtractedRequirement[] = [];
  let currentCategory: string | undefined;
  let reqIndex = 0;

  function processBlocks(blockList: NotionBlock[], depth = 0) {
    for (const block of blockList) {
      // heading_3로 카테고리 분류
      if (block.type === "heading_3") {
        currentCategory = block.heading_3.rich_text
          .map((t) => t.plain_text)
          .join("");
      }

      // bulleted_list_item을 요구사항으로 변환
      if (block.type === "bulleted_list_item") {
        const text = block.bulleted_list_item.rich_text
          .map((t) => t.plain_text)
          .join("");

        if (text.trim()) {
          // [선택] 또는 (선택) 마커가 있으면 선택사항
          const isOptional = /\[선택\]|\(선택\)|선택\s*:/i.test(text);
          // 마커 제거한 깨끗한 제목
          const cleanTitle = text
            .replace(/\[선택\]|\(선택\)|선택\s*:/gi, "")
            .trim();

          requirements.push({
            id: `req-${reqIndex++}`,
            title: cleanTitle,
            isRequired: !isOptional,
            category: currentCategory,
          });

          // 중첩된 리스트 아이템은 설명으로 처리하지 않음 (별도 요구사항으로)
          if ("children" in block && block.children) {
            processBlocks(block.children, depth + 1);
          }
        }
      }

      // numbered_list_item도 요구사항으로 처리
      if (block.type === "numbered_list_item") {
        const text = block.numbered_list_item.rich_text
          .map((t) => t.plain_text)
          .join("");

        if (text.trim()) {
          const isOptional = /\[선택\]|\(선택\)|선택\s*:/i.test(text);
          const cleanTitle = text
            .replace(/\[선택\]|\(선택\)|선택\s*:/gi, "")
            .trim();

          requirements.push({
            id: `req-${reqIndex++}`,
            title: cleanTitle,
            isRequired: !isOptional,
            category: currentCategory,
          });

          if ("children" in block && block.children) {
            processBlocks(block.children, depth + 1);
          }
        }
      }
    }
  }

  processBlocks(blocks);
  return requirements;
}
