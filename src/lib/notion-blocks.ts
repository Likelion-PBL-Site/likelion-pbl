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
import { readCache, writeCache } from "@/data/notion-cache";

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
 * 1. JSON 캐시에서 먼저 읽기 시도 (missionId 또는 pageId로)
 * 2. 캐시가 없으면 Notion API로 폴백
 * 3. API에서 가져온 데이터는 자동으로 캐시에 저장
 *
 * @param pageId - Notion 페이지 ID
 * @param missionId - 미션 ID (캐시 조회용, 선택적)
 */
export async function fetchMissionSections(
  pageId: string,
  missionId?: string
): Promise<MissionSections> {
  // 1. JSON 캐시에서 읽기 시도 (missionId 또는 pageId로)
  const cacheKey = missionId || pageId;
  try {
    const cached = await readCache(cacheKey);
    if (cached && cached.sections) {
      console.log(`[Notion] 캐시에서 로드: ${cacheKey}`);
      return cached.sections;
    }
  } catch (error) {
    console.warn(`[Notion] 캐시 읽기 실패: ${cacheKey}`, error);
  }

  // 2. Notion API로 폴백
  console.log(`[Notion] API에서 로드: ${pageId}`);
  const blocks = await fetchPageBlocks(pageId);
  const sections = parseBlocksToSections(blocks);

  // 3. 캐시에 자동 저장 (on-demand caching)
  const normalizedPageId = pageId.replace(/-/g, "");
  const cacheId = missionId || normalizedPageId;
  try {
    await writeCache({
      missionId: cacheId,
      notionPageId: pageId,
      sections,
      syncedAt: new Date().toISOString(),
    });
    console.log(`[Notion] 캐시에 저장 완료: ${cacheId}`);
  } catch (error) {
    console.warn(`[Notion] 캐시 저장 실패: ${cacheId}`, error);
  }

  return sections;
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
 * 블록 ID로 새로운 이미지 URL 획득
 * Notion S3 이미지 URL이 만료되었을 때 호출
 *
 * @param blockId - Notion 블록 ID
 * @returns 새로운 이미지 URL 또는 null (이미지 블록이 아닌 경우)
 */
export async function fetchFreshImageUrl(blockId: string): Promise<string | null> {
  try {
    const client = getNotionClient();
    const block = await client.blocks.retrieve({ block_id: blockId });

    // 이미지 블록인지 확인
    if ("type" in block && block.type === "image") {
      const imageBlock = block as BlockObjectResponse & {
        image: {
          type: "file" | "external";
          file?: { url: string };
          external?: { url: string };
        };
      };

      if (imageBlock.image.type === "file" && imageBlock.image.file?.url) {
        console.log(`[Image Refresh] 새 URL 획득 성공: ${blockId}`);
        return imageBlock.image.file.url;
      } else if (imageBlock.image.type === "external" && imageBlock.image.external?.url) {
        return imageBlock.image.external.url;
      }
    }

    console.warn(`[Image Refresh] 이미지 블록이 아님: ${blockId}`);
    return null;
  } catch (error) {
    console.error(`[Image Refresh] 블록 조회 실패: ${blockId}`, error);
    return null;
  }
}

/**
 * 블록 ID로 새로운 비디오 URL 획득
 * Notion S3 비디오 URL이 만료되었을 때 호출
 *
 * @param blockId - Notion 블록 ID
 * @returns 새로운 비디오 URL 또는 null (비디오 블록이 아닌 경우)
 */
export async function fetchFreshVideoUrl(blockId: string): Promise<string | null> {
  try {
    const client = getNotionClient();
    const block = await client.blocks.retrieve({ block_id: blockId });

    // 비디오 블록인지 확인
    if ("type" in block && block.type === "video") {
      const videoBlock = block as BlockObjectResponse & {
        video: {
          type: "file" | "external";
          file?: { url: string };
          external?: { url: string };
        };
      };

      if (videoBlock.video.type === "file" && videoBlock.video.file?.url) {
        console.log(`[Video Refresh] 새 URL 획득 성공: ${blockId}`);
        return videoBlock.video.file.url;
      } else if (videoBlock.video.type === "external" && videoBlock.video.external?.url) {
        return videoBlock.video.external.url;
      }
    }

    console.warn(`[Video Refresh] 비디오 블록이 아님: ${blockId}`);
    return null;
  } catch (error) {
    console.error(`[Video Refresh] 블록 조회 실패: ${blockId}`, error);
    return null;
  }
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
 * heading_3만 주요 단계(체크포인트)로 추출
 *
 * 예: "1. Scanner 클래스 import" → { id: "heading-xxx", title: "Scanner 클래스 import", number: 1 }
 */
export function extractRequirements(blocks: NotionBlock[]): ExtractedRequirement[] {
  const requirements: ExtractedRequirement[] = [];

  function processBlocks(blockList: NotionBlock[]) {
    for (const block of blockList) {
      // heading_3만 체크포인트로 추출
      if (block.type === "heading_3") {
        const text = block.heading_3.rich_text
          .map((t) => t.plain_text)
          .join("");

        if (text.trim()) {
          // "1. 제목" 형식 파싱
          const match = text.match(/^(\d+)\.\s*(.+)$/);
          const title = match ? match[2].trim() : text.trim();
          const number = match ? parseInt(match[1], 10) : undefined;

          requirements.push({
            id: block.id,
            title,
            isRequired: true, // heading_3는 모두 필수 단계
            category: number ? `Step ${number}` : undefined,
          });
        }
      }

      // 자식 블록에서도 heading_3 찾기 (toggle 내부 등)
      if ("children" in block && block.children) {
        processBlocks(block.children);
      }
    }
  }

  processBlocks(blocks);
  return requirements;
}
