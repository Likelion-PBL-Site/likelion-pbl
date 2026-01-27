/**
 * Notion 캐시 관리 유틸리티
 */
import fs from "fs/promises";
import path from "path";
import type { MissionSections } from "@/types/notion-blocks";
import type { MissionSummary, TrackType } from "@/types/pbl";

const CACHE_DIR = path.join(process.cwd(), "src/data/notion-cache");

export interface CachedMissionData {
  missionId: string;
  notionPageId: string;
  sections: MissionSections;
  syncedAt: string; // ISO date string
}

export interface CachedTrackData {
  trackId: TrackType;
  missions: MissionSummary[];
  syncedAt: string; // ISO date string
}

/**
 * Notion 페이지 ID 정규화 (하이픈 제거)
 */
function normalizePageId(pageId: string): string {
  return pageId.replace(/-/g, "");
}

/**
 * 캐시 파일 경로 생성
 */
export function getCachePath(missionId: string): string {
  return path.join(CACHE_DIR, `${missionId}.json`);
}

/**
 * 캐시 파일 읽기
 * missionId 또는 notionPageId로 조회 가능
 */
export async function readCache(idOrPageId: string): Promise<CachedMissionData | null> {
  // 1. 먼저 ID로 직접 조회 시도
  try {
    const filePath = getCachePath(idOrPageId);
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as CachedMissionData;
  } catch {
    // 파일이 없으면 계속 진행
  }

  // 2. notionPageId로 모든 캐시 파일 검색
  try {
    const normalizedPageId = normalizePageId(idOrPageId);
    const files = await fs.readdir(CACHE_DIR);

    for (const file of files) {
      if (!file.endsWith(".json")) continue;

      try {
        const filePath = path.join(CACHE_DIR, file);
        const content = await fs.readFile(filePath, "utf-8");
        const data = JSON.parse(content) as CachedMissionData;

        // notionPageId가 일치하면 반환
        if (normalizePageId(data.notionPageId) === normalizedPageId) {
          return data;
        }
      } catch {
        // 개별 파일 읽기 실패는 무시
      }
    }
  } catch {
    // 디렉토리 읽기 실패
  }

  return null;
}

/**
 * 캐시 파일 쓰기
 */
export async function writeCache(data: CachedMissionData): Promise<void> {
  const filePath = getCachePath(data.missionId);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * 캐시 파일 삭제
 */
export async function deleteCache(missionId: string): Promise<boolean> {
  try {
    const filePath = getCachePath(missionId);
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 모든 캐시 파일 목록 조회
 */
export async function listCacheFiles(): Promise<string[]> {
  try {
    const files = await fs.readdir(CACHE_DIR);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""));
  } catch {
    return [];
  }
}

/**
 * 트랙 캐시 파일 경로 생성
 */
export function getTrackCachePath(trackId: TrackType): string {
  return path.join(CACHE_DIR, `track-${trackId}.json`);
}

/**
 * 트랙 캐시 파일 읽기
 */
export async function readTrackCache(trackId: TrackType): Promise<CachedTrackData | null> {
  try {
    const filePath = getTrackCachePath(trackId);
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as CachedTrackData;
  } catch {
    return null;
  }
}

/**
 * 트랙 캐시 파일 쓰기
 */
export async function writeTrackCache(data: CachedTrackData): Promise<void> {
  const filePath = getTrackCachePath(data.trackId);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}
