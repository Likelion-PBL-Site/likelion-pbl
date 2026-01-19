import { Client } from "@notionhq/client";
import type {
  PageObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";
import type { Mission, MissionSummary, Requirement, TrackType, DifficultyType } from "@/types/pbl";

/**
 * 노션 클라이언트 인스턴스 생성
 * 환경 변수가 없으면 null 반환 (목업 데이터 사용)
 */
function createNotionClient(): Client | null {
  if (!process.env.NOTION_API_KEY) {
    return null;
  }
  return new Client({ auth: process.env.NOTION_API_KEY });
}

/**
 * 노션 클라이언트 가져오기
 * 타입 가드를 통해 null이 아닌 경우만 반환
 */
function getNotionClient(): Client {
  const client = createNotionClient();
  if (!client) {
    throw new Error("노션 클라이언트가 설정되지 않았습니다.");
  }
  return client;
}

/**
 * 노션 연동 여부 확인
 */
export function isNotionConfigured(): boolean {
  return !!(process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID);
}

/**
 * Rich Text를 문자열로 변환
 */
function richTextToString(richText: RichTextItemResponse[]): string {
  return richText.map((item) => item.plain_text).join("");
}

/**
 * 노션 Select 속성에서 값 추출
 */
function getSelectValue(property: unknown): string | null {
  if (
    property &&
    typeof property === "object" &&
    "select" in property &&
    property.select &&
    typeof property.select === "object" &&
    "name" in property.select
  ) {
    return property.select.name as string;
  }
  return null;
}

/**
 * 노션 Number 속성에서 값 추출
 */
function getNumberValue(property: unknown): number {
  if (
    property &&
    typeof property === "object" &&
    "number" in property &&
    typeof property.number === "number"
  ) {
    return property.number;
  }
  return 0;
}

/**
 * 노션 URL 속성에서 값 추출
 */
function getUrlValue(property: unknown): string | undefined {
  if (
    property &&
    typeof property === "object" &&
    "url" in property &&
    typeof property.url === "string"
  ) {
    return property.url;
  }
  return undefined;
}

/**
 * 노션 Rich Text 속성에서 문자열 추출
 */
function getRichTextValue(property: unknown): string {
  if (
    property &&
    typeof property === "object" &&
    "rich_text" in property &&
    Array.isArray(property.rich_text)
  ) {
    return richTextToString(property.rich_text as RichTextItemResponse[]);
  }
  return "";
}

/**
 * 노션 Title 속성에서 문자열 추출
 */
function getTitleValue(property: unknown): string {
  if (
    property &&
    typeof property === "object" &&
    "title" in property &&
    Array.isArray(property.title)
  ) {
    return richTextToString(property.title as RichTextItemResponse[]);
  }
  return "";
}

/**
 * 노션 Checkbox 속성에서 값 추출
 */
function getCheckboxValue(property: unknown): boolean {
  if (
    property &&
    typeof property === "object" &&
    "checkbox" in property &&
    typeof property.checkbox === "boolean"
  ) {
    return property.checkbox;
  }
  return false;
}

/**
 * 트랙 문자열을 TrackType으로 변환
 */
function parseTrackType(track: string | null): TrackType {
  const trackMap: Record<string, TrackType> = {
    React: "react",
    react: "react",
    SpringBoot: "springboot",
    springboot: "springboot",
    Django: "django",
    django: "django",
    Design: "design",
    design: "design",
  };
  return trackMap[track || ""] || "react";
}

/**
 * 난이도 문자열을 DifficultyType으로 변환
 */
function parseDifficultyType(difficulty: string | null): DifficultyType {
  const difficultyMap: Record<string, DifficultyType> = {
    Beginner: "beginner",
    beginner: "beginner",
    Intermediate: "intermediate",
    intermediate: "intermediate",
    Advanced: "advanced",
    advanced: "advanced",
  };
  return difficultyMap[difficulty || ""] || "beginner";
}

/**
 * 노션 Multi-select 속성에서 값들 추출 (태그용)
 */
function getMultiSelectValues(property: unknown): string[] {
  if (
    property &&
    typeof property === "object" &&
    "multi_select" in property &&
    Array.isArray(property.multi_select)
  ) {
    return (property.multi_select as Array<{ name: string }>).map((item) => item.name);
  }
  return [];
}

/**
 * 노션 페이지를 MissionSummary로 변환
 */
function pageToMissionSummary(page: PageObjectResponse): MissionSummary {
  const props = page.properties;

  return {
    id: page.id.replace(/-/g, ""),
    title: getTitleValue(props.Title),
    description: getRichTextValue(props.Description),
    track: parseTrackType(getSelectValue(props.Track)),
    difficulty: parseDifficultyType(getSelectValue(props.Difficulty)),
    estimatedTime: getNumberValue(props.EstimatedTime),
    order: getNumberValue(props.Order),
    tags: getMultiSelectValues(props.Tags),
  };
}

/**
 * 노션 페이지를 Mission으로 변환
 */
function pageToMission(
  page: PageObjectResponse,
  requirements: Requirement[]
): Mission {
  const props = page.properties;

  return {
    ...pageToMissionSummary(page),
    introduction: getRichTextValue(props.Introduction),
    objective: getRichTextValue(props.Objective),
    result: getRichTextValue(props.Result),
    timeGoal: getRichTextValue(props.TimeGoal),
    requirements,
    guidelines: getRichTextValue(props.Guidelines),
    exampleUrl: getUrlValue(props.ExampleUrl),
    exampleImages: [], // 이미지는 별도 처리 필요
    constraints: getRichTextValue(props.Constraints),
    bonusTask: getRichTextValue(props.BonusTask),
    notionPageId: page.id, // Notion 페이지 ID 저장
  };
}

/**
 * 노션에서 모든 미션 목록 조회
 */
export async function fetchMissionsFromNotion(): Promise<MissionSummary[]> {
  if (!isNotionConfigured()) {
    return [];
  }

  try {
    const client = getNotionClient();
    const response = await client.databases.query({
      database_id: process.env.NOTION_DATABASE_ID!,
      filter: {
        property: "Status",
        select: {
          equals: "Published",
        },
      },
      sorts: [
        { property: "Track", direction: "ascending" },
        { property: "Order", direction: "ascending" },
      ],
    });

    return response.results
      .filter((page): page is PageObjectResponse => "properties" in page)
      .map(pageToMissionSummary);
  } catch (error) {
    console.error("노션 미션 목록 조회 실패:", error);
    return [];
  }
}

/**
 * 노션에서 트랙별 미션 목록 조회
 */
export async function fetchMissionsByTrackFromNotion(
  track: TrackType
): Promise<MissionSummary[]> {
  if (!isNotionConfigured()) {
    return [];
  }

  const trackName = track.charAt(0).toUpperCase() + track.slice(1);

  try {
    const client = getNotionClient();
    const response = await client.databases.query({
      database_id: process.env.NOTION_DATABASE_ID!,
      filter: {
        and: [
          {
            property: "Status",
            select: { equals: "Published" },
          },
          {
            property: "Track",
            select: { equals: trackName },
          },
        ],
      },
      sorts: [{ property: "Order", direction: "ascending" }],
    });

    return response.results
      .filter((page): page is PageObjectResponse => "properties" in page)
      .map(pageToMissionSummary);
  } catch (error) {
    console.error(`노션 ${track} 트랙 미션 조회 실패:`, error);
    return [];
  }
}

/**
 * 노션에서 요구사항 목록 조회
 */
async function fetchRequirementsFromNotion(
  missionId: string
): Promise<Requirement[]> {
  if (!process.env.NOTION_API_KEY || !process.env.NOTION_REQUIREMENTS_DB_ID) {
    return [];
  }

  try {
    const client = getNotionClient();
    const response = await client.databases.query({
      database_id: process.env.NOTION_REQUIREMENTS_DB_ID,
      filter: {
        property: "Mission",
        relation: {
          contains: missionId,
        },
      },
      sorts: [{ property: "Order", direction: "ascending" }],
    });

    return response.results
      .filter((page): page is PageObjectResponse => "properties" in page)
      .map((page) => {
        const props = page.properties;
        return {
          id: page.id.replace(/-/g, ""),
          title: getTitleValue(props.Title),
          description: getRichTextValue(props.Description),
          isRequired: getCheckboxValue(props.IsRequired),
          order: getNumberValue(props.Order),
        };
      });
  } catch (error) {
    console.error("노션 요구사항 조회 실패:", error);
    return [];
  }
}

/**
 * 노션에서 미션 상세 조회
 */
export async function fetchMissionByIdFromNotion(
  missionId: string
): Promise<Mission | null> {
  if (!process.env.NOTION_API_KEY) {
    return null;
  }

  try {
    const client = getNotionClient();

    // 미션 ID 형식 변환 (하이픈 추가)
    const formattedId = missionId.replace(
      /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
      "$1-$2-$3-$4-$5"
    );

    const page = await client.pages.retrieve({
      page_id: formattedId,
    });

    if (!("properties" in page)) {
      return null;
    }

    // 요구사항 조회
    const requirements = await fetchRequirementsFromNotion(formattedId);

    return pageToMission(page as PageObjectResponse, requirements);
  } catch (error) {
    console.error(`노션 미션 상세 조회 실패 (ID: ${missionId}):`, error);
    return null;
  }
}
