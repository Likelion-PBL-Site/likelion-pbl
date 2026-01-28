#!/usr/bin/env node
/**
 * Notion 캐시 동기화 스크립트
 *
 * Notion DB에서 모든 미션을 자동으로 조회하여 캐시에 저장합니다.
 * GitHub Actions에서 주기적으로 실행되어 모든 미션을 미리 캐싱합니다.
 *
 * 사용법:
 *   node scripts/sync-notion-cache.mjs                    # 모든 미션 동기화
 *   node scripts/sync-notion-cache.mjs <미션ID 또는 페이지ID>  # 특정 미션만 동기화
 *
 * 환경 변수:
 *   NOTION_API_KEY       - Notion API 키 (필수)
 *   NOTION_DB_SPRINGBOOT - SpringBoot 트랙 DB ID
 *   NOTION_DB_REACT      - React 트랙 DB ID
 *   NOTION_DB_DJANGO     - Django 트랙 DB ID
 *   NOTION_DB_DESIGN     - Design 트랙 DB ID
 */

import { config } from "dotenv";
import { Client } from "@notionhq/client";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// .env 파일 로드
config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, "../src/data/notion-cache");

// 트랙별 Notion 데이터베이스 ID
const TRACK_DATABASES = {
  springboot: process.env.NOTION_DB_SPRINGBOOT,
  react: process.env.NOTION_DB_REACT,
  django: process.env.NOTION_DB_DJANGO,
  design: process.env.NOTION_DB_DESIGN,
};

/**
 * 섹션 매핑 (Notion 헤딩 텍스트 → 섹션 키)
 */
const SECTION_MAPPING = {
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
 * Notion 클라이언트 생성
 */
function getNotionClient() {
  if (!process.env.NOTION_API_KEY) {
    throw new Error("NOTION_API_KEY 환경 변수가 설정되지 않았습니다.");
  }
  return new Client({ auth: process.env.NOTION_API_KEY });
}

/**
 * 주차 문자열에서 숫자 추출 (예: "05주", "[1주차]" → 5, 1)
 */
function parseWeekNumber(weekStr) {
  const match = weekStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Number 속성에서 값 추출
 */
function getNumberValue(property) {
  if (property?.number !== undefined && property?.number !== null) {
    return property.number;
  }
  return null;
}

/**
 * Select 속성에서 값 추출
 */
function getSelectValue(property) {
  if (property?.select?.name) {
    return property.select.name;
  }
  return null;
}

/**
 * Multi-select 속성에서 값들 추출
 */
function getMultiSelectValues(property) {
  if (property?.multi_select && Array.isArray(property.multi_select)) {
    return property.multi_select.map((item) => item.name);
  }
  return [];
}

/**
 * Rich Text 속성에서 문자열 추출
 */
function getRichTextValue(property) {
  if (property?.rich_text && Array.isArray(property.rich_text)) {
    return property.rich_text.map((t) => t.plain_text).join("");
  }
  return "";
}

/**
 * Title 속성에서 문자열 추출
 */
function getTitleValue(property) {
  if (property?.title && Array.isArray(property.title)) {
    return property.title.map((t) => t.plain_text).join("");
  }
  return "";
}

/**
 * Notion DB에서 모든 미션 페이지 목록 조회
 */
async function fetchMissionsFromDatabase(client, databaseId, trackName) {
  const missions = [];

  try {
    const response = await client.databases.query({
      database_id: databaseId,
    });

    for (const page of response.results) {
      if (!("properties" in page)) continue;

      const pageId = page.id;
      const normalizedId = pageId.replace(/-/g, "");
      const props = page.properties;

      // 새 DB 컬럼 매핑
      const weekStr = getTitleValue(props["콘텐츠 제작물"]);
      const topic = getRichTextValue(props["주제"]);
      const description = getRichTextValue(props["주요 학습 내용"]);
      const stage = getSelectValue(props["단계"]);
      const tags = getMultiSelectValues(props["핵심 기술 키워드"]);

      // 주차 번호: number 타입 '주차' 컬럼 우선, 없으면 '콘텐츠 제작물'에서 파싱
      const weekNumber = getNumberValue(props["주차"]) ?? parseWeekNumber(weekStr);

      missions.push({
        missionId: normalizedId,
        notionPageId: pageId,
        title: topic || weekStr,
        track: trackName,
        // MissionSummary 형식에 맞게 추가
        summary: {
          id: normalizedId,
          title: topic || weekStr,
          description: description,
          track: trackName,
          stage: stage || "",
          estimatedTime: 120,
          order: weekNumber,
          tags: tags,
        },
      });
    }
  } catch (error) {
    console.error(`   ⚠️ ${trackName} DB 조회 실패:`, error.message);
  }

  return missions;
}

/**
 * 설정된 모든 트랙에서 미션 목록 가져오기
 */
async function fetchAllMissions(client) {
  const allMissions = [];

  for (const [track, dbId] of Object.entries(TRACK_DATABASES)) {
    if (!dbId) {
      console.log(`   ⏭️ ${track}: DB ID 미설정, 건너뜀`);
      continue;
    }

    console.log(`   📂 ${track}: 미션 목록 조회 중...`);
    const missions = await fetchMissionsFromDatabase(client, dbId, track);
    console.log(`      → ${missions.length}개 미션 발견`);
    allMissions.push(...missions);
  }

  return allMissions;
}

/**
 * 블록에서 plain text 추출
 */
function getBlockPlainText(block) {
  const blockType = block.type;
  const blockData = block[blockType];

  if (blockData?.rich_text) {
    return blockData.rich_text.map((t) => t.plain_text).join("");
  }
  return "";
}

/**
 * 섹션 키 찾기
 */
function findSectionKey(text) {
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

/**
 * 페이지의 모든 블록 가져오기 (재귀)
 */
async function fetchPageBlocks(client, pageId) {
  const blocks = [];
  let cursor;

  do {
    const response = await client.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const block of response.results) {
      if ("type" in block) {
        // 자식 블록이 있으면 재귀적으로 가져오기
        if (block.has_children) {
          block.children = await fetchPageBlocks(client, block.id);
        }
        blocks.push(block);
      }
    }

    cursor = response.next_cursor ?? undefined;
  } while (cursor);

  return blocks;
}

/**
 * 블록 배열을 섹션별로 파싱
 */
function parseBlocksToSections(blocks) {
  const sections = {
    introduction: [],
    objective: [],
    result: [],
    timeGoal: [],
    guidelines: [],
    example: [],
    constraints: [],
    bonus: [],
  };

  let currentSection = null;

  for (const block of blocks) {
    // 최상위 Heading 3 블록으로 섹션 구분
    if (block.type === "heading_3") {
      const text = getBlockPlainText(block);
      const sectionKey = findSectionKey(text);

      if (sectionKey) {
        currentSection = sectionKey;

        // 토글 헤딩인 경우: children이 섹션 콘텐츠
        if (block.children && block.children.length > 0) {
          sections[currentSection].push(...block.children);
        }
        continue;
      }
    }

    // Callout 블록 내부의 Heading 3 확인
    if (block.type === "callout" && block.children) {
      for (const child of block.children) {
        if (child.type === "heading_3") {
          const text = getBlockPlainText(child);
          const sectionKey = findSectionKey(text);

          if (sectionKey) {
            currentSection = sectionKey;

            if (child.children && child.children.length > 0) {
              sections[currentSection].push(...child.children);
            } else {
              const remainingChildren = block.children.filter(
                (c) => c.id !== child.id
              );
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
 * 단일 미션 동기화
 */
async function syncMission(client, missionId, notionPageId) {
  console.log(`\n📥 동기화 중: ${missionId} (${notionPageId})`);

  const startTime = Date.now();

  // 블록 가져오기
  const blocks = await fetchPageBlocks(client, notionPageId);
  console.log(`   - 블록 ${blocks.length}개 조회 완료`);

  // 섹션 파싱
  const sections = parseBlocksToSections(blocks);
  const sectionCounts = Object.entries(sections)
    .map(([key, arr]) => `${key}: ${arr.length}`)
    .join(", ");
  console.log(`   - 섹션 파싱 완료 (${sectionCounts})`);

  // JSON 저장
  const cacheData = {
    missionId,
    notionPageId,
    sections,
    syncedAt: new Date().toISOString(),
  };

  const cachePath = path.join(CACHE_DIR, `${missionId}.json`);
  await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2), "utf-8");

  const elapsed = Date.now() - startTime;
  console.log(`   ✅ 저장 완료: ${cachePath} (${elapsed}ms)`);

  return cacheData;
}

/**
 * all-missions.json 재생성 (개별 캐시 파일들을 통합)
 */
async function regenerateAllMissionsCache() {
  console.log("\n📦 all-missions.json 재생성 중...");

  const files = await fs.readdir(CACHE_DIR);
  const allMissions = {};

  for (const file of files) {
    // 개별 미션 캐시 파일만 처리 (track-*, all-missions.json 제외)
    if (file.endsWith('.json') && !file.startsWith('track-') && file !== 'all-missions.json') {
      const filePath = path.join(CACHE_DIR, file);
      const content = JSON.parse(await fs.readFile(filePath, 'utf-8'));

      if (content.missionId && content.sections) {
        allMissions[content.missionId] = content;
      }
    }
  }

  const allMissionsPath = path.join(CACHE_DIR, 'all-missions.json');
  await fs.writeFile(allMissionsPath, JSON.stringify(allMissions, null, 2), 'utf-8');
  console.log(`   ✅ all-missions.json 저장 완료 (${Object.keys(allMissions).length}개 미션)`);
}

/**
 * 트랙별 미션 목록 캐시 저장
 */
async function saveTrackCache(trackName, missions) {
  const trackCacheData = {
    trackId: trackName,
    missions: missions
      .filter((m) => m.track === trackName)
      .map((m) => m.summary)
      .sort((a, b) => a.order - b.order),
    syncedAt: new Date().toISOString(),
  };

  const cachePath = path.join(CACHE_DIR, `track-${trackName}.json`);
  await fs.writeFile(cachePath, JSON.stringify(trackCacheData, null, 2), "utf-8");
  console.log(`   📁 트랙 캐시 저장: ${cachePath} (${trackCacheData.missions.length}개 미션)`);
}

/**
 * 메인 함수
 */
async function main() {
  const args = process.argv.slice(2);
  const targetMissionId = args[0];

  console.log("🔄 Notion 캐시 동기화 시작");
  console.log(`   캐시 디렉토리: ${CACHE_DIR}`);

  // 캐시 디렉토리 확인
  try {
    await fs.access(CACHE_DIR);
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    console.log("   캐시 디렉토리 생성됨");
  }

  const client = getNotionClient();

  // 🆕 Notion DB에서 모든 미션 동적 조회
  console.log("\n📡 Notion 데이터베이스에서 미션 목록 조회 중...");
  const allMissions = await fetchAllMissions(client);

  if (allMissions.length === 0) {
    console.error("❌ 동기화할 미션이 없습니다. DB ID 설정을 확인하세요.");
    process.exit(1);
  }

  // 🆕 트랙별 미션 목록 캐시 저장
  console.log("\n📦 트랙별 미션 목록 캐시 저장 중...");
  const tracks = [...new Set(allMissions.map((m) => m.track))];
  for (const track of tracks) {
    await saveTrackCache(track, allMissions);
  }

  // 동기화 대상 필터링 (특정 미션 ID 지정 시)
  const targets = targetMissionId
    ? allMissions.filter((m) =>
        m.missionId === targetMissionId ||
        m.notionPageId.replace(/-/g, "") === targetMissionId.replace(/-/g, "")
      )
    : allMissions;

  if (targets.length === 0) {
    console.error(`❌ 미션을 찾을 수 없습니다: ${targetMissionId}`);
    console.log("   사용 가능한 미션 ID:");
    allMissions.forEach((m) => console.log(`   - ${m.missionId} (${m.title})`));
    process.exit(1);
  }

  console.log(`\n📋 미션 상세 동기화 대상: ${targets.length}개 미션`);

  const results = [];
  for (const mission of targets) {
    try {
      const result = await syncMission(
        client,
        mission.missionId,
        mission.notionPageId
      );
      results.push({ ...mission, success: true, syncedAt: result.syncedAt });
    } catch (error) {
      console.error(`   ❌ 실패: ${error.message}`);
      results.push({ ...mission, success: false, error: error.message });
    }
  }

  // 결과 요약
  console.log("\n" + "=".repeat(50));
  console.log("📊 동기화 결과 요약");
  console.log("=".repeat(50));

  const success = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✅ 성공: ${success.length}개`);
  if (failed.length > 0) {
    console.log(`❌ 실패: ${failed.length}개`);
    failed.forEach((f) => console.log(`   - ${f.missionId}: ${f.error}`));
  }

  // 트랙별 통계
  const byTrack = {};
  for (const r of success) {
    byTrack[r.track] = (byTrack[r.track] || 0) + 1;
  }
  if (Object.keys(byTrack).length > 0) {
    console.log("\n📊 트랙별 동기화:");
    for (const [track, count] of Object.entries(byTrack)) {
      console.log(`   - ${track}: ${count}개`);
    }
  }

  // 🆕 all-missions.json 재생성 (정적 import용 통합 캐시)
  await regenerateAllMissionsCache();

  console.log("\n🎉 동기화 완료!");
}

main().catch((error) => {
  console.error("❌ 동기화 실패:", error);
  process.exit(1);
});
