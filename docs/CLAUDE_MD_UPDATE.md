# CLAUDE.md 업데이트 내용

Notion 연동 구현 후 CLAUDE.md에 추가해야 할 섹션들입니다.

---

## 1. 디렉토리 구조 업데이트

```
src/
├── app/
│   └── api/
│       └── notion/
│           ├── route.ts          # 미션 데이터 API
│           └── image/
│               └── route.ts      # 이미지 프록시 API (신규)
├── components/
│   └── notion/                   # Notion 블록 렌더러 (신규)
│       ├── notion-block-renderer.tsx
│       ├── notion-rich-text.tsx
│       └── blocks/
│           ├── paragraph.tsx
│           ├── heading.tsx
│           ├── list.tsx
│           ├── quote.tsx
│           ├── callout.tsx
│           ├── code.tsx
│           ├── image.tsx
│           └── divider.tsx
├── lib/
│   ├── notion.ts                 # Notion 페이지/DB API
│   └── notion-blocks.ts          # Notion 블록 API (신규)
├── types/
│   └── notion-blocks.ts          # Notion 블록 타입 (신규)
├── data/
│   └── tracks.ts                 # 트랙 정보 + Notion 페이지 ID (신규)
└── docs/
    └── NOTION_IMAGE_PROXY.md     # 이미지 프록시 문서
```

---

## 2. Notion 연동 섹션 추가

```markdown
### Notion 연동

**블록 API 사용**
- 미션 콘텐츠는 Notion 페이지 블록에서 동적으로 가져옴
- `lib/notion-blocks.ts`: 블록 조회 및 섹션 파싱
- `components/notion/`: 블록 타입별 렌더러

**이미지 처리**
- Notion 이미지 URL은 1시간 후 만료됨
- `/api/notion/image` 프록시로 해결
- 상세: `docs/NOTION_IMAGE_PROXY.md` 참조

**섹션 파싱 규칙**
- Callout 블록 내부의 Heading 3로 섹션 구분
- 섹션 매핑: `1. 미션 소개` → `introduction` 등
```

---

## 3. 트랙 타입 섹션 업데이트

```markdown
### 트랙 타입 (`src/types/pbl.ts`)

\`\`\`typescript
type TrackType = "react" | "springboot" | "django" | "design"
\`\`\`

| ID | 이름 | Notion Page ID |
|----|------|----------------|
| react | 프론트엔드 (React) | 2edffd33-... |
| springboot | 백엔드 (Spring Boot) | 2edffd33-... |
| django | 백엔드 (Django) | 2edffd33-... |
| design | 기획/디자인 | 2edffd33-... |
```

---

## 4. 미션 상세 페이지 섹션 업데이트

```markdown
### 미션 상세 페이지 탭 (7개)

| 탭 | Notion 섹션 | 컴포넌트 |
|----|------------|---------|
| 미션 소개 | 1. 미션 소개 | NotionBlockRenderer |
| 과제 목표 | 2. 과제 목표 | NotionBlockRenderer |
| 최종 결과물 | 3. 최종 결과물 | NotionBlockRenderer |
| 구현 지침 | 5. 기능 요구 사항 | NotionBlockRenderer |
| 결과 예시 | 6. 결과 예시 | NotionBlockRenderer (이미지 포함) |
| 제약 사항 | 7. 제약 사항 | NotionBlockRenderer |
| 보너스 | 8. 보너스 과제 | NotionBlockRenderer |

**목표 수행 시간**: 헤더 영역에 표시 (트랙/난이도 옆)
```

---

## 5. API 라우트 섹션 추가

```markdown
### API 라우트

**GET /api/notion**
- `?track=springboot`: 트랙별 미션 목록
- `?id={missionId}`: 미션 상세 (DB 속성)

**GET /api/notion/image**
- `?url={encodedUrl}`: Notion 이미지 프록시
- 캐시: 50분 (`max-age=3000`)
- 허용 도메인: `prod-files-secure.s3.us-west-2.amazonaws.com`
```

---

## 6. 환경 변수 섹션 업데이트

```markdown
### 환경 변수

\`\`\`env
# Notion API
NOTION_API_KEY=secret_xxx        # Notion Integration 키
NOTION_DATABASE_ID=xxx           # 미션 DB ID (선택)
NOTION_REQUIREMENTS_DB_ID=xxx    # 요구사항 DB ID (선택)
\`\`\`

**설정 방법**
1. https://notion.so/my-integrations 에서 Integration 생성
2. 연동할 페이지에서 Integration 연결 필수
```

---

## 7. 의존성 추가

```markdown
### 주요 의존성

- `shiki`: 코드 블록 문법 하이라이팅
```

---

## 적용 순서

1. Notion 연동 구현 완료 후
2. 위 내용을 CLAUDE.md에 반영
3. 기존 mock-data 관련 설명 업데이트
