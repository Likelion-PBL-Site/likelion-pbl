/**
 * Notion 캐시 관리 유틸리티
 */
import fs from "fs/promises";
import path from "path";
import type { MissionSections } from "@/types/notion-blocks";

const CACHE_DIR = path.join(process.cwd(), "src/data/notion-cache");

export interface CachedMissionData {
  missionId: string;
  notionPageId: string;
  sections: MissionSections;
  syncedAt: string; // ISO date string
}

/**
 * 캐시 파일 경로 생성
 */
export function getCachePath(missionId: string): string {
  return path.join(CACHE_DIR, `${missionId}.json`);
}

/**
 * 캐시 파일 읽기
 */
export async function readCache(missionId: string): Promise<CachedMissionData | null> {
  try {
    const filePath = getCachePath(missionId);
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as CachedMissionData;
  } catch {
    // 파일이 없거나 읽기 실패
    return null;
  }
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
