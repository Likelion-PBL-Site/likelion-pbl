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
 */
export const mockReactMissions: Mission[] = [
  {
    id: "fe-mission-1",
    title: "React 컴포넌트 기초",
    description: "React의 기본 개념을 이해하고 재사용 가능한 컴포넌트를 만들어봅니다.",
    track: "react",
    result: "",
    difficulty: "beginner",
    estimatedTime: 120,
    order: 1,
    tags: ["React", "컴포넌트", "Props"],
    introduction: `이번 미션에서는 React의 핵심 개념인 컴포넌트에 대해 학습합니다.

컴포넌트는 UI를 독립적이고 재사용 가능한 조각으로 나눈 것입니다. 마치 레고 블록처럼 작은 컴포넌트들을 조합하여 복잡한 UI를 만들 수 있습니다.

이 미션을 통해 여러분은:
- 함수형 컴포넌트를 작성하는 방법
- Props를 통해 데이터를 전달하는 방법
- 컴포넌트를 재사용하는 패턴

을 익히게 됩니다.`,
    objective: `- 버튼 컴포넌트를 만들고 다양한 스타일 변형을 구현합니다
- 카드 컴포넌트를 만들고 children prop을 활용합니다
- 만든 컴포넌트들을 조합하여 간단한 UI를 구성합니다`,
    timeGoal: "이 과제는 약 2시간 내에 완료하는 것을 목표로 합니다. React가 처음이라면 3시간까지 소요될 수 있습니다.",
    requirements: [
      {
        id: "req-1",
        title: "Button 컴포넌트 구현",
        description: "variant prop으로 primary, secondary, outline 스타일을 지원하는 버튼 컴포넌트를 만드세요.",
        isRequired: true,
        order: 1,
      },
      {
        id: "req-2",
        title: "Button 크기 변형 추가",
        description: "size prop으로 sm, md, lg 크기를 지원하도록 확장하세요.",
        isRequired: true,
        order: 2,
      },
      {
        id: "req-3",
        title: "Card 컴포넌트 구현",
        description: "children prop을 받아 내용을 렌더링하는 카드 컴포넌트를 만드세요.",
        isRequired: true,
        order: 3,
      },
      {
        id: "req-4",
        title: "컴포넌트 조합",
        description: "Card 안에 Button을 배치하여 완성된 UI를 구성하세요.",
        isRequired: true,
        order: 4,
      },
    ],
    guidelines: `### 1. 프로젝트 설정
\`\`\`bash
npx create-next-app@latest my-app --typescript
cd my-app
\`\`\`

### 2. Button 컴포넌트 구조
\`\`\`tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}
\`\`\`

### 3. 스타일링 팁
- Tailwind CSS의 조건부 클래스를 활용하세요
- clsx나 cn 유틸리티 함수를 사용하면 편리합니다`,
    exampleUrl: "https://example.com/demo/button",
    exampleImages: ["/examples/button-variants.png"],
    constraints: `- 외부 UI 라이브러리(MUI, Chakra 등)를 사용하지 마세요
- 순수 React와 Tailwind CSS만 사용합니다
- TypeScript를 사용하여 Props 타입을 정의하세요`,
    bonusTask: `- disabled 상태 구현
- 로딩 상태 (isLoading prop) 추가
- 아이콘을 포함할 수 있는 IconButton 변형 만들기`,
  },
  {
    id: "fe-mission-2",
    title: "상태 관리와 이벤트 처리",
    description: "useState와 이벤트 핸들러를 활용하여 인터랙티브한 UI를 만듭니다.",
    track: "react",
    result: "",
    difficulty: "beginner",
    estimatedTime: 150,
    order: 2,
    tags: ["React", "useState", "이벤트"],
    introduction: `React에서 상태(State)는 컴포넌트의 동적인 데이터를 관리합니다.

useState 훅을 사용하면 함수형 컴포넌트에서도 상태를 관리할 수 있습니다. 사용자 인터랙션에 따라 UI가 업데이트되는 것이 React의 핵심입니다.`,
    objective: `- 카운터 앱을 만들어 상태 업데이트를 이해합니다
- 폼 입력을 상태로 관리합니다
- 조건부 렌더링을 구현합니다`,
    timeGoal: "이 과제는 약 2시간 30분 내에 완료하는 것을 목표로 합니다.",
    requirements: [
      {
        id: "req-1",
        title: "카운터 구현",
        description: "+, - 버튼으로 숫자를 증감하는 카운터를 만드세요.",
        isRequired: true,
        order: 1,
      },
      {
        id: "req-2",
        title: "입력 폼 구현",
        description: "이름과 이메일을 입력받는 폼을 만들고 상태로 관리하세요.",
        isRequired: true,
        order: 2,
      },
      {
        id: "req-3",
        title: "조건부 렌더링",
        description: "입력값이 있을 때만 제출 버튼을 활성화하세요.",
        isRequired: true,
        order: 3,
      },
    ],
    guidelines: `### useState 기본 사용법
\`\`\`tsx
const [count, setCount] = useState(0);
\`\`\`

### 이벤트 핸들러
\`\`\`tsx
<button onClick={() => setCount(count + 1)}>
  증가
</button>
\`\`\``,
    constraints: `- 클래스형 컴포넌트를 사용하지 마세요
- 전역 상태 관리 라이브러리를 사용하지 마세요`,
    bonusTask: `- 로컬 스토리지에 상태 저장하기
- useReducer로 리팩토링하기`,
  },
  {
    id: "fe-mission-3",
    title: "API 연동과 데이터 페칭",
    description: "외부 API에서 데이터를 가져와 화면에 표시합니다.",
    track: "react",
    result: "",
    difficulty: "intermediate",
    estimatedTime: 180,
    order: 3,
    tags: ["React", "API", "useEffect", "로딩"],
    introduction: `실제 서비스에서는 서버에서 데이터를 가져와야 합니다. React에서는 useEffect 훅과 fetch API를 활용하여 데이터를 불러올 수 있습니다.`,
    objective: `- 공개 API에서 데이터를 가져옵니다
- 로딩 상태를 표시합니다
- 에러 처리를 구현합니다`,
    timeGoal: "이 과제는 약 3시간 내에 완료하는 것을 목표로 합니다.",
    requirements: [
      {
        id: "req-1",
        title: "데이터 페칭",
        description: "JSONPlaceholder API에서 게시글 목록을 가져오세요.",
        isRequired: true,
        order: 1,
      },
      {
        id: "req-2",
        title: "로딩 UI",
        description: "데이터 로딩 중 스켈레톤 또는 스피너를 표시하세요.",
        isRequired: true,
        order: 2,
      },
      {
        id: "req-3",
        title: "에러 처리",
        description: "API 호출 실패 시 에러 메시지를 표시하세요.",
        isRequired: true,
        order: 3,
      },
      {
        id: "req-4",
        title: "게시글 상세",
        description: "게시글 클릭 시 상세 내용을 모달로 표시하세요.",
        isRequired: true,
        order: 4,
      },
    ],
    guidelines: `### useEffect로 데이터 페칭
\`\`\`tsx
useEffect(() => {
  fetch('https://jsonplaceholder.typicode.com/posts')
    .then(res => res.json())
    .then(data => setPosts(data));
}, []);
\`\`\``,
    constraints: `- axios 대신 fetch API를 사용하세요
- React Query 등 데이터 페칭 라이브러리를 사용하지 마세요`,
    bonusTask: `- 무한 스크롤 구현
- 검색 기능 추가
- 캐싱 구현`,
  },
];

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
    difficulty: "beginner",
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
    difficulty: "beginner",
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
 */
export const mockDesignMissions: Mission[] = [
  {
    id: "de-mission-1",
    title: "사용자 페르소나 설계",
    description: "서비스의 타겟 사용자를 정의하고 페르소나를 만듭니다.",
    track: "design",
    result: "",
    difficulty: "beginner",
    estimatedTime: 90,
    order: 1,
    tags: ["UX", "페르소나", "사용자 조사"],
    introduction: `페르소나는 서비스의 가상 사용자입니다. 실제 사용자 데이터를 기반으로 만들어진 페르소나는 팀 전체가 같은 사용자를 바라보게 해줍니다.`,
    objective: `- 타겟 사용자 그룹을 정의합니다
- 3개의 페르소나를 작성합니다
- 사용자 니즈를 도출합니다`,
    timeGoal: "이 과제는 약 1시간 30분 내에 완료하는 것을 목표로 합니다.",
    requirements: [
      {
        id: "req-1",
        title: "타겟 정의",
        description: "서비스의 주요 타겟 사용자 그룹을 정의하세요.",
        isRequired: true,
        order: 1,
      },
      {
        id: "req-2",
        title: "페르소나 작성",
        description: "이름, 나이, 직업, 목표, 불편함을 포함한 페르소나를 작성하세요.",
        isRequired: true,
        order: 2,
      },
      {
        id: "req-3",
        title: "사용자 여정 지도",
        description: "페르소나의 서비스 이용 과정을 시각화하세요.",
        isRequired: true,
        order: 3,
      },
    ],
    guidelines: `### 페르소나 템플릿
- 이름, 나이, 직업
- 목표와 동기
- 불편함과 Pain Point
- 기술 친화도`,
    constraints: `- 최소 3개의 페르소나를 만드세요
- 가상의 인물이지만 현실적으로 설정하세요`,
    bonusTask: `- 사용자 인터뷰 질문지 작성
- 경쟁 서비스 분석 추가`,
  },
];

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
  // 노션이 설정되어 있으면 노션에서 데이터 가져오기
  if (isNotionConfigured()) {
    const notionMissions = await fetchMissionsByTrackFromNotion(track);
    if (notionMissions.length > 0) {
      return notionMissions;
    }
    // 노션에 데이터가 없으면 목업 데이터 사용
    console.warn(`노션에서 ${track} 트랙 미션을 찾을 수 없어 목업 데이터를 사용합니다.`);
  }

  // 목업 데이터 반환
  return getMissionsByTrackSync(track);
}

/**
 * 미션 상세 정보 가져오기 (노션 연동 지원)
 * 노션이 설정되어 있으면 노션에서, 아니면 목업 데이터에서 가져옴
 */
export async function getMissionById(missionId: string): Promise<Mission | undefined> {
  // 노션이 설정되어 있으면 노션에서 데이터 가져오기
  if (isNotionConfigured()) {
    const notionMission = await fetchMissionByIdFromNotion(missionId);
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
    difficulty: mission.difficulty,
    estimatedTime: mission.estimatedTime,
    order: mission.order,
    tags: mission.tags,
  };
}
