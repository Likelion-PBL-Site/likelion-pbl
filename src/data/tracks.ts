import type { TrackInfo, TrackType } from "@/types/pbl";

/**
 * 트랙 정보 및 Notion 페이지 ID 매핑
 */
export const tracks: TrackInfo[] = [
  {
    id: "react",
    name: "프론트엔드 (React)",
    description:
      "React, Next.js를 활용한 웹 프론트엔드 개발을 학습합니다. 컴포넌트 설계부터 상태 관리, 배포까지 실무 역량을 키웁니다.",
    icon: "Monitor",
    color: "var(--track-frontend)",
    missionCount: 10,
    notionPageId: "2edffd33-6b70-808c-843c-db1950a1d816",
  },
  {
    id: "springboot",
    name: "백엔드 (Spring Boot)",
    description:
      "Java와 Spring Boot를 활용한 서버 개발을 학습합니다. API 설계, 데이터베이스, JPA까지 백엔드 전반을 다룹니다.",
    icon: "Server",
    color: "var(--track-backend)",
    missionCount: 10,
    notionPageId: "2edffd33-6b70-805b-b7a8-e34acbd75e2d",
  },
  {
    id: "django",
    name: "백엔드 (Django)",
    description:
      "Python과 Django를 활용한 서버 개발을 학습합니다. REST API 설계, ORM, 인증/인가까지 백엔드 전반을 다룹니다.",
    icon: "Server",
    color: "var(--track-backend)",
    missionCount: 10,
    notionPageId: "2edffd33-6b70-80f0-b2a7-ff34db97e405",
  },
  {
    id: "design",
    name: "기획/디자인",
    description:
      "서비스 기획과 UI/UX 디자인을 학습합니다. 사용자 조사부터 와이어프레임, 프로토타입 제작까지 경험합니다.",
    icon: "Palette",
    color: "var(--track-design)",
    missionCount: 10,
    notionPageId: "2edffd33-6b70-8054-8a63-cf94ab9e7c85",
  },
];

/**
 * 트랙 ID로 트랙 정보 조회
 */
export function getTrackById(trackId: TrackType): TrackInfo | undefined {
  return tracks.find((track) => track.id === trackId);
}

/**
 * 트랙 ID로 Notion 페이지 ID 조회
 */
export function getNotionPageIdByTrack(trackId: TrackType): string | undefined {
  const track = getTrackById(trackId);
  return track?.notionPageId;
}

/**
 * 유효한 트랙 ID인지 확인
 */
export function isValidTrackId(trackId: string): trackId is TrackType {
  return tracks.some((track) => track.id === trackId);
}

/**
 * 모든 트랙 ID 목록
 */
export const trackIds: TrackType[] = tracks.map((track) => track.id);
