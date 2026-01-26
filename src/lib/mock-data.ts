import type { Mission, MissionSummary, TrackType } from "@/types/pbl";
import {
  isNotionConfigured,
  fetchMissionsByTrackFromNotion,
  fetchMissionByIdFromNotion,
} from "@/lib/notion";
import { tracks } from "@/data/tracks";

// tracks를 재 export (하위 호환성)
export { tracks };
export { tracks as mockTracks };

/**
 * 목업 미션 데이터 - React (프론트엔드)
 * TODO: Notion 연동 시 실제 데이터로 대체
 */
export const mockReactMissions: Mission[] = [];

/**
 * 목업 미션 데이터 - Spring Boot (백엔드)
 */
export const mockSpringbootMissions: Mission[] = [
  {
    id: "be-mission-1",
    title: "Java 기초 - 콘솔 입출력",
    description: "Java의 기본 문법과 Scanner를 활용한 콘솔 입출력을 학습합니다.",
    track: "springboot",
    result: "",
    stage: "Java",
    estimatedTime: 120,
    order: 1,
    tags: ["Java", "Scanner", "콘솔"],
    // Notion 페이지 ID 연결 (SpringBoot 1주차)
    notionPageId: "2edffd33-6b70-80d8-9c6a-c761b6f718f2",
    introduction: `REST API는 웹 서비스의 기본입니다. 이 미션에서는 Express.js를 사용하여 기본적인 CRUD(Create, Read, Update, Delete) API를 구현합니다.`,
    objective: `- Express.js 서버를 설정합니다
- RESTful 엔드포인트를 설계합니다
- JSON 데이터를 주고받습니다`,
    timeGoal: "이 과제는 약 2시간 30분 내에 완료하는 것을 목표로 합니다.",
    requirements: [
      {
        id: "req-1",
        title: "서버 설정",
        description: "Express.js 서버를 설정하고 3000 포트에서 실행하세요.",
        isRequired: true,
        order: 1,
      },
      {
        id: "req-2",
        title: "GET 엔드포인트",
        description: "할 일 목록을 반환하는 GET /todos 엔드포인트를 만드세요.",
        isRequired: true,
        order: 2,
      },
      {
        id: "req-3",
        title: "POST 엔드포인트",
        description: "새 할 일을 추가하는 POST /todos 엔드포인트를 만드세요.",
        isRequired: true,
        order: 3,
      },
      {
        id: "req-4",
        title: "DELETE 엔드포인트",
        description: "할 일을 삭제하는 DELETE /todos/:id 엔드포인트를 만드세요.",
        isRequired: true,
        order: 4,
      },
    ],
    guidelines: `### Express 기본 설정
\`\`\`javascript
const express = require('express');
const app = express();
app.use(express.json());
\`\`\``,
    constraints: `- 데이터베이스 대신 메모리(배열)에 데이터를 저장하세요
- TypeScript를 권장하지만 JavaScript도 가능합니다`,
    bonusTask: `- 입력 유효성 검사 추가
- 에러 핸들링 미들웨어 구현
- Swagger 문서화`,
  },
  {
    id: "be-mission-2",
    title: "객체지향 프로그래밍 I – 클래스와 캡슐화",
    description: "Java의 객체지향 개념을 이해하고 클래스와 캡슐화를 학습합니다.",
    track: "springboot",
    result: "",
    stage: "Java",
    estimatedTime: 150,
    order: 2,
    tags: ["Java", "OOP", "클래스", "캡슐화"],
    // Notion 페이지 ID 연결 (SpringBoot 2주차)
    notionPageId: "2edffd33-6b70-80db-b1af-f0ac2765fb21",
    introduction: `이번 미션에서는 객체지향 프로그래밍의 핵심 개념인 클래스와 캡슐화를 학습합니다.`,
    objective: `- 클래스와 객체의 개념을 이해합니다
- 필드와 메서드를 정의합니다
- 접근 제어자를 활용한 캡슐화를 구현합니다`,
    timeGoal: "이 과제는 약 2시간 30분 내에 완료하는 것을 목표로 합니다.",
    requirements: [
      {
        id: "req-1",
        title: "클래스 정의",
        description: "기본 클래스를 정의하고 필드와 메서드를 추가하세요.",
        isRequired: true,
        order: 1,
      },
      {
        id: "req-2",
        title: "생성자 구현",
        description: "생성자를 통해 객체를 초기화하세요.",
        isRequired: true,
        order: 2,
      },
      {
        id: "req-3",
        title: "캡슐화 적용",
        description: "private 필드와 getter/setter를 구현하세요.",
        isRequired: true,
        order: 3,
      },
    ],
    guidelines: `### 클래스 기본 구조
\`\`\`java
public class Student {
    private String name;
    private int age;

    public Student(String name, int age) {
        this.name = name;
        this.age = age;
    }
}
\`\`\``,
    constraints: `- Java 17 이상을 사용하세요
- 모든 필드는 private으로 선언하세요`,
    bonusTask: `- toString() 메서드 오버라이딩
- equals()와 hashCode() 구현`,
  },
];

/**
 * 목업 미션 데이터 - Django (백엔드)
 * TODO: Notion 연동 시 실제 데이터로 대체
 */
export const mockDjangoMissions: Mission[] = [];

/**
 * 목업 미션 데이터 - 기획/디자인
 * TODO: Notion 연동 시 실제 데이터로 대체
 */
export const mockDesignMissions: Mission[] = [];

/**
 * 트랙별 미션 목록 가져오기 (동기 - 목업 데이터만)
 */
export function getMissionsByTrackSync(track: string): MissionSummary[] {
  switch (track) {
    case "react":
      return mockReactMissions.map(missionToSummary);
    case "springboot":
      return mockSpringbootMissions.map(missionToSummary);
    case "django":
      return mockDjangoMissions.map(missionToSummary);
    case "design":
      return mockDesignMissions.map(missionToSummary);
    default:
      return [];
  }
}

/**
 * 미션 상세 정보 가져오기 (동기 - 목업 데이터만)
 */
export function getMissionByIdSync(missionId: string): Mission | undefined {
  const allMissions = [
    ...mockReactMissions,
    ...mockSpringbootMissions,
    ...mockDjangoMissions,
    ...mockDesignMissions,
  ];
  return allMissions.find((m) => m.id === missionId);
}

/**
 * 트랙별 미션 목록 가져오기 (노션 연동 지원)
 * 노션이 설정되어 있으면 노션에서, 아니면 목업 데이터에서 가져옴
 */
export async function getMissionsByTrack(track: TrackType): Promise<MissionSummary[]> {
  console.log(`[getMissionsByTrack] track=${track}, isNotionConfigured=${isNotionConfigured()}`);

  // 노션이 설정되어 있으면 노션에서 데이터 가져오기
  if (isNotionConfigured()) {
    const notionMissions = await fetchMissionsByTrackFromNotion(track);
    console.log(`[getMissionsByTrack] Notion returned ${notionMissions.length} missions`);
    if (notionMissions.length > 0) {
      console.log(`[getMissionsByTrack] Returning Notion data only`);
      return notionMissions;
    }
    // 노션에 데이터가 없으면 목업 데이터 사용
    console.warn(`노션에서 ${track} 트랙 미션을 찾을 수 없어 목업 데이터를 사용합니다.`);
  }

  console.log(`[getMissionsByTrack] Returning mock data`);
  // 목업 데이터 반환
  return getMissionsByTrackSync(track);
}

/**
 * 미션 상세 정보 가져오기 (노션 연동 지원)
 * 노션이 설정되어 있으면 노션에서, 아니면 목업 데이터에서 가져옴
 * @param missionId 미션 ID
 * @param track 트랙 정보 (알고 있는 경우 전달하면 더 정확한 결과)
 */
export async function getMissionById(missionId: string, track?: TrackType): Promise<Mission | undefined> {
  // 노션이 설정되어 있으면 노션에서 데이터 가져오기
  if (isNotionConfigured()) {
    const notionMission = await fetchMissionByIdFromNotion(missionId, track);
    if (notionMission) {
      return notionMission;
    }
    // 노션에서 못 찾으면 목업 데이터에서 시도
    console.warn(`노션에서 미션(${missionId})을 찾을 수 없어 목업 데이터를 사용합니다.`);
  }

  // 목업 데이터에서 반환
  return getMissionByIdSync(missionId);
}

/**
 * Mission을 MissionSummary로 변환
 */
function missionToSummary(mission: Mission): MissionSummary {
  return {
    id: mission.id,
    title: mission.title,
    description: mission.description,
    track: mission.track,
    stage: mission.stage,
    estimatedTime: mission.estimatedTime,
    order: mission.order,
    tags: mission.tags,
  };
}
