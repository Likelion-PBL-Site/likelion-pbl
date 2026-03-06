#!/usr/bin/env node
/**
 * Notion 캐시 동기화 스크립트
 *
 * Notion DB에서 모든 미션을 자동으로 조회하여 캐시에 저장합니다.
 * GitHub Actions에서 주기적으로 실행되어 모든 미션을 미리 캐싱합니다.
 *
 * 사용법:
 *   node scripts/sync-notion-cache.mjs                    # 증분 동기화 (변경된 미션만)
 *   node scripts/sync-notion-cache.mjs --force             # 전체 강제 동기화
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

// ─── 동시성 제어 유틸리티 ───

/**
 * Promise 기반 동시성 제한 (p-limit 대체)
 * @param {number} concurrency - 최대 동시 실행 수
 */
function createLimiter(concurrency) {
  const queue = [];
  let active = 0;

  function next() {
    while (active < concurrency && queue.length > 0) {
      active++;
      const { fn, resolve, reject } = queue.shift();
      fn().then(resolve, reject).finally(() => {
        active--;
        next();
      });
    }
  }

  return function limit(fn) {
    return new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
      next();
    });
  };
}

/**
 * 429 Rate Limit 재시도 래퍼
 * Notion API의 Retry-After 헤더를 존중한다.
 */
async function withRetry(fn, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error?.status === 429 && attempt < maxRetries) {
        const retryAfter = error?.headers?.get?.("retry-after");
        const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 1000 * Math.pow(2, attempt);
        console.log(`   ⏳ Rate limit. ${waitMs}ms 후 재시도 (${attempt + 1}/${maxRetries})`);
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }
      throw error;
    }
  }
}

// Notion API 동시성 제한 (rate limit: 3 req/sec)
const apiLimiter = createLimiter(3);
// 미션 단위 동시 처리 상한 (메모리 관리)
const missionLimiter = createLimiter(5);

// 트랙별 Notion 데이터베이스 ID
const TRACK_DATABASES = {
  springboot: process.env.NOTION_DB_SPRINGBOOT,
  react: process.env.NOTION_DB_REACT,
  django: process.env.NOTION_DB_DJANGO,
  design: process.env.NOTION_DB_DESIGN,
};

/**
 * 슬러그 생성 (파일명용)
 * 예: "HTML/CSS 기초" → "html-css-기초"
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[\/\\&]+/g, "-")      // 슬래시, 백슬래시, & → 하이픈
    .replace(/[()[\]{}'"]+/g, "")   // 괄호, 따옴표 제거
    .replace(/\s+/g, "-")           // 공백 → 하이픈
    .replace(/-+/g, "-")            // 연속 하이픈 → 단일 하이픈
    .replace(/^-|-$/g, "")          // 앞뒤 하이픈 제거
    .slice(0, 40);                  // 최대 40자
}

/**
 * 캐시 파일명 생성
 * 형식: {track}-{order:02d}-{slug}.json
 * 예: react-01-html-css-기초.json
 */
function generateCacheFileName(track, order, title) {
  const paddedOrder = String(order).padStart(2, "0");
  const slug = generateSlug(title);
  return `${track}-${paddedOrder}-${slug}.json`;
}

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
  "9. VOD": "vod",
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
    const response = await withRetry(() =>
      apiLimiter(() => client.databases.query({ database_id: databaseId }))
    );

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
        lastEditedTime: page.last_edited_time,
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
 * 페이지의 모든 블록 가져오기 (병렬 자식 블록 fetch)
 */
async function fetchPageBlocks(client, pageId) {
  const blocks = [];
  let cursor;

  // 1. 현재 depth의 블록을 모두 수집
  do {
    const response = await withRetry(() =>
      apiLimiter(() =>
        client.blocks.children.list({
          block_id: pageId,
          start_cursor: cursor,
          page_size: 100,
        })
      )
    );

    for (const block of response.results) {
      if ("type" in block) {
        blocks.push(block);
      }
    }

    cursor = response.next_cursor ?? undefined;
  } while (cursor);

  // 2. has_children인 블록들의 자식을 병렬로 fetch
  // 주의: apiLimiter로 감싸지 않음 (내부에서 이미 apiLimiter 사용, 중첩 시 deadlock)
  const blocksWithChildren = blocks.filter((b) => b.has_children);
  if (blocksWithChildren.length > 0) {
    await Promise.all(
      blocksWithChildren.map(async (block) => {
        block.children = await fetchPageBlocks(client, block.id);
      })
    );
  }

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
    vod: [],
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
async function syncMission(client, mission) {
  const { missionId, notionPageId, title, track, summary, lastEditedTime } = mission;
  const order = summary?.order || 0;

  // 가독성 있는 파일명 생성
  const fileName = generateCacheFileName(track, order, title);

  console.log(`\n📥 동기화 중: ${fileName}`);
  console.log(`   - 미션: ${title} (${track} ${order}주차)`);

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

  // JSON 저장 (missionId 유지 - 앱에서 조회용)
  const cacheData = {
    missionId,
    notionPageId,
    fileName,  // 새 파일명 참조용
    lastEditedTime,  // 증분 동기화용 (변경 감지)
    sections,
    syncedAt: new Date().toISOString(),
  };

  const cachePath = path.join(CACHE_DIR, fileName);
  await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2), "utf-8");

  const elapsed = Date.now() - startTime;
  console.log(`   ✅ 저장 완료: ${fileName} (${elapsed}ms)`);

  return cacheData;
}

/**
 * 기존 개별 미션 캐시 파일 정리 (track-*, all-missions.json 제외)
 */
async function cleanupOldCacheFiles() {
  console.log("\n🧹 기존 캐시 파일 정리 중...");

  const files = await fs.readdir(CACHE_DIR);
  let deleted = 0;

  for (const file of files) {
    // track-*, all-missions.json, index.ts 제외하고 모든 json 파일 삭제
    if (file.endsWith('.json') && !file.startsWith('track-') && file !== 'all-missions.json') {
      const filePath = path.join(CACHE_DIR, file);
      await fs.unlink(filePath);
      deleted++;
    }
  }

  if (deleted > 0) {
    console.log(`   🗑️ ${deleted}개 기존 파일 삭제 완료`);
  }
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
  const forceSync = args.includes("--force");
  const targetMissionId = args.find((a) => a !== "--force");

  console.log("🔄 Notion 캐시 동기화 시작");
  console.log(`   캐시 디렉토리: ${CACHE_DIR}`);
  if (forceSync) console.log("   🔧 강제 동기화 모드 (--force)");

  // 캐시 디렉토리 확인
  try {
    await fs.access(CACHE_DIR);
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    console.log("   캐시 디렉토리 생성됨");
  }

  const client = getNotionClient();

  // Notion DB에서 모든 미션 동적 조회
  console.log("\n📡 Notion 데이터베이스에서 미션 목록 조회 중...");
  const allMissions = await fetchAllMissions(client);

  if (allMissions.length === 0) {
    console.error("❌ 동기화할 미션이 없습니다. DB ID 설정을 확인하세요.");
    process.exit(1);
  }

  // 트랙별 미션 목록 캐시 저장
  console.log("\n📦 트랙별 미션 목록 캐시 저장 중...");
  const trackNames = [...new Set(allMissions.map((m) => m.track))];
  for (const track of trackNames) {
    await saveTrackCache(track, allMissions);
  }

  // --force일 때만 기존 캐시 파일 정리
  if (forceSync) {
    await cleanupOldCacheFiles();
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

  // 증분 동기화: 변경된 미션만 필터링
  let syncTargets;
  if (forceSync || targetMissionId) {
    syncTargets = targets;
  } else {
    syncTargets = [];
    let skipped = 0;

    for (const mission of targets) {
      const fileName = generateCacheFileName(mission.track, mission.summary?.order || 0, mission.title);
      const cachePath = path.join(CACHE_DIR, fileName);

      try {
        const existing = JSON.parse(await fs.readFile(cachePath, "utf-8"));
        if (existing.lastEditedTime && existing.lastEditedTime === mission.lastEditedTime) {
          skipped++;
          continue;
        }
      } catch {
        // 캐시 파일 없음 → 새 미션
      }

      syncTargets.push(mission);
    }

    if (skipped > 0) {
      console.log(`\n⏭️  변경 없는 미션 건너뜀: ${skipped}개`);
    }
  }

  console.log(`📋 동기화 대상: ${syncTargets.length}개 미션`);

  if (syncTargets.length === 0) {
    console.log("\n✨ 변경된 미션이 없습니다. 동기화 건너뜀.");
    await regenerateAllMissionsCache();
    console.log("\n🎉 동기화 완료!");
    return;
  }

  // 병렬 미션 동기화 (최대 5개 동시)
  const results = await Promise.all(
    syncTargets.map((mission) =>
      missionLimiter(async () => {
        try {
          const result = await syncMission(client, mission);
          return { ...mission, success: true, syncedAt: result.syncedAt, fileName: result.fileName };
        } catch (error) {
          console.error(`   ❌ 실패: ${mission.title} - ${error.message}`);
          return { ...mission, success: false, error: error.message };
        }
      })
    )
  );

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

  // all-missions.json 재생성 (정적 import용 통합 캐시)
  await regenerateAllMissionsCache();

  console.log("\n🎉 동기화 완료!");
}

main().catch((error) => {
  console.error("❌ 동기화 실패:", error);
  process.exit(1);
});
