#!/usr/bin/env node
/**
 * Notion 캐시 동기화 스크립트
 *
 * 사용법:
 *   node scripts/sync-notion-cache.mjs              # 모든 미션 동기화
 *   node scripts/sync-notion-cache.mjs be-mission-1 # 특정 미션만 동기화
 *
 * 환경 변수:
 *   NOTION_API_KEY - Notion API 키 (필수)
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

// 동기화할 미션 목록 (notionPageId가 있는 것만)
const MISSIONS_WITH_NOTION = [
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

  // 동기화 대상 필터링
  const targets = targetMissionId
    ? MISSIONS_WITH_NOTION.filter((m) => m.missionId === targetMissionId)
    : MISSIONS_WITH_NOTION;

  if (targets.length === 0) {
    console.error(`❌ 미션을 찾을 수 없습니다: ${targetMissionId}`);
    process.exit(1);
  }

  console.log(`\n📋 동기화 대상: ${targets.length}개 미션`);

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

  console.log("\n🎉 동기화 완료!");
}

main().catch((error) => {
  console.error("❌ 동기화 실패:", error);
  process.exit(1);
});
