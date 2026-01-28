# 멋쟁이사자처럼 PBL

> 프로젝트 기반 학습(Project-Based Learning) 플랫폼

![Hero](public/screenshots/hero-light.png)

## 소개

멋사 대학 PBL은 프론트엔드, 백엔드, 기획/디자인 분야의 실전형 교육 플랫폼입니다.
프로젝트를 직접 만들며 배우는 **10주 커리큘럼**을 제공합니다.

## 주요 기능

### 트랙 선택

4개 트랙 중 관심 분야를 선택하여 학습을 시작할 수 있습니다.

![Tracks](public/screenshots/tracks.png)

- **프론트엔드 (React)** - HTML/CSS부터 React, TypeScript까지
- **백엔드 (Spring Boot)** - Java, Spring, JPA 기반 서버 개발
- **백엔드 (Django)** - Python, Django, DRF 기반 서버 개발
- **기획/디자인** - 서비스 기획부터 UI/UX 디자인까지

### 커리큘럼 표

주차별 미션과 핵심 키워드를 한눈에 확인할 수 있습니다.

![Curriculum](public/screenshots/curriculum.png)

### 미션 상세

각 미션의 목표, 구현 지침, 결과 예시를 단계별로 안내합니다.

| 라이트 모드 | 다크 모드 |
|------------|----------|
| ![Light](public/screenshots/mission-light.png) | ![Dark](public/screenshots/mission-dark.png) |

- 섹션별 탭 UI (미션 소개, 과제 목표, 구현 지침 등)
- 진행률 체크리스트
- 다크모드 지원

## 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript, React 19 |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui |
| State | Zustand |
| CMS | Notion API |
| Deployment | Vercel |

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

## 환경 변수

```env
NOTION_API_KEY=         # Notion Integration 키
NOTION_DB_REACT=        # React 트랙 DB ID
NOTION_DB_SPRINGBOOT=   # Spring Boot 트랙 DB ID
NOTION_DB_DJANGO=       # Django 트랙 DB ID
NOTION_DB_DESIGN=       # Design 트랙 DB ID
```

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (pbl)/[trackId]/   # 트랙 및 미션 페이지
│   ├── tracks/            # 트랙 선택 페이지
│   └── api/notion/        # Notion API 엔드포인트
├── components/
│   ├── ui/                # shadcn/ui 컴포넌트
│   ├── curriculum/        # 커리큘럼 표
│   ├── mission/           # 미션 상세 컴포넌트
│   └── notion/            # Notion 블록 렌더러
├── lib/                   # 유틸리티 함수
├── store/                 # Zustand 스토어
└── data/
    └── notion-cache/      # Notion 캐시 (자동 동기화)
```

## 라이선스

© 2026 LIKELION UNIV. All rights reserved.
