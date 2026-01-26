/**
 * PBL(Project-based Learning) 관련 타입 정의
 */

/** 트랙 타입 */
export type TrackType = "react" | "springboot" | "django" | "design";

/** 난이도 타입 */
export type DifficultyType = "beginner" | "intermediate" | "advanced";

/** 미션 상태 타입 */
export type MissionStatus = "draft" | "published" | "archived";

/** 요구사항 아이템 */
export interface Requirement {
  id: string;
  title: string;
  description?: string;
  isRequired: boolean;
  order: number;
}

/** 미션 기본 정보 (목록용) */
export interface MissionSummary {
  id: string;
  title: string;
  description: string;
  track: TrackType;
  /** 단계 (Notion DB의 원본값: Java, Spring Core, 기초, 문제 정의 등) */
  stage: string;
  estimatedTime: number; // 분 단위
  order: number;
  tags: string[];
}

/** 미션 상세 정보 */
export interface Mission extends MissionSummary {
  /** 1. 미션 소개 */
  introduction: string;
  /** 2. 과제 목표 */
  objective: string;
  /** 3. 최종 결과물 */
  result: string;
  /** 4. 목표 수행 시간 설명 */
  timeGoal: string;
  /** 5. 기능 요구 사항 (구현 지침) */
  requirements: Requirement[];
  /** 5. 구현 지침 (마크다운) */
  guidelines: string;
  /** 6. 결과 예시 URL */
  exampleUrl?: string;
  /** 6. 결과 예시 이미지들 */
  exampleImages?: string[];
  /** 7. 제약 사항 */
  constraints: string;
  /** 8. 보너스 과제 */
  bonusTask: string;
  /** Notion 페이지 ID (선택) */
  notionPageId?: string;
}

/** 미션 진행 상태 (로컬 저장용) */
export interface MissionProgress {
  missionId: string;
  completedRequirements: string[]; // requirement id 배열
  isCompleted: boolean;
  lastVisited: string; // ISO date string
}

/** 트랙 정보 */
export interface TrackInfo {
  id: TrackType;
  name: string;
  description: string;
  icon: string;
  color: string;
  missionCount?: number;
  /** Notion 트랙 페이지 ID */
  notionPageId?: string;
}

/** 난이도 라벨 매핑 */
export const difficultyLabels: Record<DifficultyType, string> = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

/** 트랙 라벨 매핑 */
export const trackLabels: Record<TrackType, string> = {
  react: "프론트엔드 (React)",
  springboot: "백엔드 (Spring Boot)",
  django: "백엔드 (Django)",
  design: "기획/디자인",
};
