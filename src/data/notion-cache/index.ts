/**
 * Notion 캐시 관리 유틸리티
 */
import fs from "fs/promises";
import path from "path";
import type { MissionSections } from "@/types/notion-blocks";
import type { MissionSummary, TrackType } from "@/types/pbl";

// 트랙 캐시 정적 import (Vercel 서버리스 환경 호환)
import trackReact from "./track-react.json";
import trackSpringboot from "./track-springboot.json";
import trackDjango from "./track-django.json";
import trackDesign from "./track-design.json";

// 미션 캐시 정적 import (Vercel 서버리스 환경 호환)
import allMissions from "./all-missions.json";

const CACHE_DIR = path.join(process.cwd(), "src/data/notion-cache");

// 미션 ID → 캐시 데이터 매핑 (정적 import)
// Note: 기존 캐시에 vod 필드가 없을 수 있어 unknown을 거쳐 캐스팅
const ALL_MISSIONS_CACHE = allMissions as unknown as Record<string, CachedMissionData>;

// 트랙별 정적 캐시 매핑
const TRACK_CACHE_MAP: Record<TrackType, CachedTrackData> = {
  react: trackReact as CachedTrackData,
  springboot: trackSpringboot as CachedTrackData,
  django: trackDjango as CachedTrackData,
  design: trackDesign as CachedTrackData,
};

export interface CachedMissionData {
  missionId: string;
  notionPageId: string;
  fileName?: string; // 가독성 있는 파일명 (예: react-01-html-css-기초.json)
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
 * @deprecated 새 형식은 fileName을 직접 사용 (예: react-01-html-css-기초.json)
 */
export function getCachePath(missionIdOrFileName: string): string {
  // 이미 .json 확장자가 있으면 그대로 사용
  const fileName = missionIdOrFileName.endsWith(".json")
    ? missionIdOrFileName
    : `${missionIdOrFileName}.json`;
  return path.join(CACHE_DIR, fileName);
}

/**
 * 캐시 파일 읽기 (정적 import 사용 - Vercel 호환)
 * missionId 또는 notionPageId로 조회 가능
 */
export async function readCache(idOrPageId: string): Promise<CachedMissionData | null> {
  const normalizedId = normalizePageId(idOrPageId);

  // 1. 먼저 ID로 직접 조회 시도
  if (ALL_MISSIONS_CACHE[normalizedId]) {
    return ALL_MISSIONS_CACHE[normalizedId];
  }

  // 2. notionPageId로 모든 캐시 검색
  for (const [, data] of Object.entries(ALL_MISSIONS_CACHE)) {
    if (normalizePageId(data.notionPageId) === normalizedId) {
      return data;
    }
  }

  return null;
}

/**
 * 캐시 파일 쓰기
 * fileName이 있으면 그것을 사용, 없으면 missionId를 fallback으로 사용
 */
export async function writeCache(data: CachedMissionData): Promise<void> {
  const fileName = data.fileName || `${data.missionId}.json`;
  const filePath = getCachePath(fileName);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * 캐시 파일 삭제
 * @param missionIdOrFileName - missionId 또는 전체 파일명
 */
export async function deleteCache(missionIdOrFileName: string): Promise<boolean> {
  try {
    const filePath = getCachePath(missionIdOrFileName);
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
 * 트랙 캐시 파일 읽기 (정적 import 사용 - Vercel 호환)
 */
export async function readTrackCache(trackId: TrackType): Promise<CachedTrackData | null> {
  // 정적 import된 캐시에서 직접 반환
  const cached = TRACK_CACHE_MAP[trackId];
  if (cached) {
    return cached;
  }
  return null;
}

/**
 * 트랙 캐시 파일 쓰기
 */
export async function writeTrackCache(data: CachedTrackData): Promise<void> {
  const filePath = getTrackCachePath(data.trackId);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}
