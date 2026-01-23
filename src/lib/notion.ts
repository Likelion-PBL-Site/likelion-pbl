import { Client } from "@notionhq/client";
import { unstable_cache } from "next/cache";
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
  return !!process.env.NOTION_API_KEY;
}

/**
 * 트랙별 데이터베이스 ID 가져오기
 */
function getTrackDatabaseId(track: TrackType): string | null {
  const dbIds: Record<TrackType, string | undefined> = {
    react: process.env.NOTION_DB_REACT,
    springboot: process.env.NOTION_DB_SPRINGBOOT,
    django: process.env.NOTION_DB_DJANGO,
    design: process.env.NOTION_DB_DESIGN,
  };
  return dbIds[track] || null;
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
 * 주차 문자열에서 숫자 추출 (예: "05주", "[1주차]" → 5, 1)
 */
function parseWeekNumber(weekStr: string): number {
  const match = weekStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * 단계를 난이도로 매핑
 */
function stageToDifficulty(stage: string | null): DifficultyType {
  const stageMap: Record<string, DifficultyType> = {
    Java: "beginner",
    "Spring Core": "intermediate",
    JPA: "intermediate",
    Project: "advanced",
  };
  return stageMap[stage || ""] || "beginner";
}

/**
 * 노션 페이지를 MissionSummary로 변환 (트랙별 커리큘럼 DB용)
 */
function pageToMissionSummary(page: PageObjectResponse, track: TrackType): MissionSummary {
  const props = page.properties;

  // 새 DB 컬럼 매핑
  // - 콘텐츠 제작물 (title) → 주차 정보
  // - 주제 (rich_text) → 미션 제목
  // - 주요 학습 내용 (rich_text) → 설명
  // - 단계 (select) → 난이도 매핑
  // - 핵심 기술 키워드 (multi_select) → 태그

  const weekStr = getTitleValue(props["콘텐츠 제작물"]);
  const topic = getRichTextValue(props["주제"]);
  const description = getRichTextValue(props["주요 학습 내용"]);
  const stage = getSelectValue(props["단계"]);
  const tags = getMultiSelectValues(props["핵심 기술 키워드"]);

  return {
    id: page.id.replace(/-/g, ""),
    title: topic || weekStr, // 주제가 없으면 주차 정보 사용
    description: description,
    track: track,
    difficulty: stageToDifficulty(stage),
    estimatedTime: 120, // 기본 2시간
    order: parseWeekNumber(weekStr),
    tags: tags,
  };
}

/**
 * 노션 페이지를 Mission으로 변환
 */
function pageToMission(
  page: PageObjectResponse,
  requirements: Requirement[],
  track: TrackType = "springboot"
): Mission {
  const props = page.properties;

  return {
    ...pageToMissionSummary(page, track),
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
 * 노션에서 모든 미션 목록 조회 (모든 트랙 합침)
 */
export async function fetchMissionsFromNotion(): Promise<MissionSummary[]> {
  if (!isNotionConfigured()) {
    return [];
  }

  const tracks: TrackType[] = ["react", "springboot", "django", "design"];
  const allMissions: MissionSummary[] = [];

  for (const track of tracks) {
    const missions = await fetchMissionsByTrackFromNotion(track);
    allMissions.push(...missions);
  }

  return allMissions;
}

/**
 * 노션에서 트랙별 미션 목록 조회 (내부 함수)
 */
async function fetchMissionsByTrackFromNotionInternal(
  track: TrackType
): Promise<MissionSummary[]> {
  if (!isNotionConfigured()) {
    return [];
  }

  // 트랙별 데이터베이스 ID 가져오기
  const databaseId = getTrackDatabaseId(track);
  if (!databaseId) {
    console.warn(`[Notion] ${track} 트랙의 데이터베이스 ID가 설정되지 않았습니다.`);
    return [];
  }

  try {
    const client = getNotionClient();
    const response = await client.databases.query({
      database_id: databaseId,
    });

    console.log(`[Notion] ${track} 트랙에서 ${response.results.length}개 미션 로드 (API 호출)`);

    // 페이지를 MissionSummary로 변환 후 order로 정렬
    const missions = response.results
      .filter((page): page is PageObjectResponse => "properties" in page)
      .map((page) => pageToMissionSummary(page, track))
      .sort((a, b) => a.order - b.order);

    return missions;
  } catch (error) {
    console.error(`[Notion] ${track} 트랙 미션 조회 실패:`, error);
    return [];
  }
}

/**
 * 노션에서 트랙별 미션 목록 조회 (캐시 적용)
 * - 1시간(3600초) 동안 캐시 유지
 * - 트랙별로 별도 캐시 키 사용
 */
export const fetchMissionsByTrackFromNotion = unstable_cache(
  fetchMissionsByTrackFromNotionInternal,
  ["notion-missions-by-track"],
  { revalidate: 3600 } // 1시간
);

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

  // UUID 형식이 아니면 바로 null 반환 (be-mission-1 같은 앱 내부 ID 처리)
  // UUID: 32자 hex (하이픈 없음) 또는 36자 (하이픈 포함)
  const uuidWithoutHyphens = missionId.replace(/-/g, "");
  if (!/^[0-9a-f]{32}$/i.test(uuidWithoutHyphens)) {
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
