# 체크리스트 UI 개선 - 탭 상단 통합 및 반응형 구현

> 작성일: 2026-01-19
> 관련 파일: `src/components/mission/`, `src/app/(pbl)/[trackId]/[missionId]/mission-detail-client.tsx`
> 태그: #feature #ui-ux #responsive #accessibility

## 배경 및 문제 상황

미션 상세 페이지의 체크리스트가 "구현 지침" 탭 내부 사이드바에만 위치하여, 사용자가 다른 탭에서 체크리스트에 접근하기 어려웠습니다.

### 증상
- 체크리스트를 확인하려면 반드시 "구현 지침" 탭으로 이동해야 함
- 미션 진행률과 체크리스트가 분리되어 있어 UX가 비효율적
- 모바일에서 사이드바 레이아웃이 비좁음

---

## AI 협업 흐름 (Prompting Log)

> 이 섹션은 Claude Code와의 대화 흐름을 기록하여, 효과적인 AI 협업 패턴을 문서화합니다.

### 1단계: 문제 정의 및 기획 요청

**User Prompt:**
> "구현 지침에 있는 체크 리스트를 다시 진행률 바 위로 올릴려고 해. 생각하고 기획해봐. 어떻게 하면 유저들이 체크리스트 하기 더 편하고 좋을지 Ui/UX 적으로도 !"

**AI Response:**
- 현재 구조 분석 (진행률 바: 미션 헤더, 체크리스트: 구현 지침 탭 사이드바)
- UX 문제점 식별:
  - 탭 전환 필요 → 인지 부하 증가
  - 진행률과 체크리스트 분리 → 직관성 저하
- **4가지 옵션 제안:**
  1. Collapsible 아코디언 (진행률 바 클릭 시 펼쳐짐)
  2. Floating 버튼 + Sheet (우하단 FAB)
  3. 컴팩트 인라인 칩 (상단에 칩 형태로 표시)
  4. 하이브리드 (데스크톱: Collapsible, 모바일: Bottom Sheet)

### 2단계: 옵션 선택

**User Prompt:**
> "옵션 4로 진행해봐"

**AI Response:**
- 구현 계획 수립 (TodoWrite 도구 활용):
  1. shadcn/ui Collapsible 컴포넌트 추가
  2. MissionChecklist 컴포넌트 분리
  3. MissionProgressChecklist 통합 컴포넌트 생성
  4. 모바일용 Bottom Sheet 구현
  5. 기존 구현 지침 탭 사이드바 제거

### 3단계: 구현 진행

**AI Actions:**
1. `npx shadcn@latest add collapsible` 실행
2. `src/components/mission/mission-checklist.tsx` 생성
3. `src/components/mission/mission-progress-checklist.tsx` 생성
4. `src/components/mission/index.ts` 배럴 export 생성
5. `mission-detail-client.tsx` 수정

### 4단계: 에러 수정

**빌드 에러 1: Unused import**
```
Error: 'Button' is declared but its value is never read.
```
- 해결: `mission-progress-checklist.tsx`에서 사용하지 않는 Button import 제거

**접근성 경고: SheetDescription 누락**
```
Warning: Missing Description or aria-describedby={undefined} for {DialogContent}
```
- 해결: SheetDescription 컴포넌트 추가 (sr-only 클래스로 시각적 숨김)

### 5단계: 테스트 및 검증

**AI Actions (Playwright MCP 활용):**
1. 데스크톱 뷰포트 (1280x800) 테스트
   - Collapsible 아코디언 동작 확인
   - 진행률 바 클릭 → 체크리스트 펼침/접기
2. 모바일 뷰포트 (375x667) 테스트
   - Bottom Sheet 동작 확인
   - 진행률 바 탭 → 하단 시트 열림

---

## 기술적 분석

### 원인/배경 분석

기존 구조의 문제점:
```
미션 상세 페이지
├── 헤더 (진행률 바만 표시)
├── 탭 네비게이션
└── 탭 콘텐츠
    └── 구현 지침 탭
        ├── 콘텐츠 (왼쪽)
        └── 체크리스트 사이드바 (오른쪽)  ← 여기서만 접근 가능
```

- 체크리스트가 특정 탭에 종속되어 접근성 저하
- 진행률 바와 체크리스트가 분리되어 인지적 연결 부족

### 해결 접근 방식

**하이브리드 반응형 패턴 선택 이유:**
1. 데스크톱: 화면 공간 충분 → Collapsible로 인라인 확장
2. 모바일: 화면 제한 → Bottom Sheet로 전체 너비 활용
3. 공통: 진행률 바와 체크리스트 통합 → 직관적 UX

```
변경 후 구조:
미션 상세 페이지
├── 헤더
├── MissionProgressChecklist  ← 모든 탭에서 접근 가능
│   ├── 진행률 바 (트리거)
│   └── 체크리스트 (Collapsible/Sheet)
├── 탭 네비게이션
└── 탭 콘텐츠 (체크리스트 사이드바 제거)
```

---

## 구현 내용

### 생성/수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/components/mission/mission-checklist.tsx` | 재사용 가능한 체크리스트 컴포넌트 (신규) |
| `src/components/mission/mission-progress-checklist.tsx` | 진행률 + 체크리스트 통합 컴포넌트 (신규) |
| `src/components/mission/index.ts` | 배럴 export (신규) |
| `src/components/ui/collapsible.tsx` | shadcn/ui Collapsible (신규) |
| `src/app/(pbl)/[trackId]/[missionId]/mission-detail-client.tsx` | 체크리스트 통합, 사이드바 제거 |

### 핵심 코드

**MissionProgressChecklist - 반응형 분기:**
```tsx
export function MissionProgressChecklist({...}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const { isMd } = useBreakpoint();  // 768px 기준

  // 데스크톱: Collapsible 아코디언
  if (isMd) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger>
          {/* 진행률 바 */}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <MissionChecklist {...} compact />
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // 모바일: Bottom Sheet
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger>
        {/* 진행률 바 */}
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetDescription className="sr-only">
          미션 요구사항 체크리스트입니다.
        </SheetDescription>
        <MissionChecklist {...} />
      </SheetContent>
    </Sheet>
  );
}
```

**MissionChecklist - compact 모드:**
```tsx
<div className={compact ? "grid gap-2 md:grid-cols-2" : "space-y-2"}>
  {requirements.map((req) => (
    // 체크박스 + 라벨 + 완료 아이콘
  ))}
</div>
```

---

## 검증

### 테스트 방법
1. Playwright MCP를 통한 자동화 테스트
2. 데스크톱/모바일 뷰포트 전환
3. 체크리스트 인터랙션 확인

### 결과
- 데스크톱 (1280x800): Collapsible 정상 동작
- 모바일 (375x667): Bottom Sheet 정상 동작
- 접근성 경고 해결 완료
- 빌드 성공

---

## 프롬프팅 인사이트

### 효과적이었던 프롬프트 패턴

1. **기획 요청 + UX 관점 명시**
   > "생각하고 기획해봐. 어떻게 하면 유저들이 체크리스트 하기 더 편하고 좋을지 UI/UX 적으로도!"

   - 단순 구현이 아닌 기획 단계부터 AI 참여 유도
   - UX 관점 명시로 다양한 옵션 도출

2. **옵션 선택 후 간결한 지시**
   > "옵션 4로 진행해봐"

   - AI가 제시한 옵션 중 선택만 하면 됨
   - 구체적인 구현은 AI가 자율적으로 진행

### 개선할 수 있는 점

- 초기 프롬프트에서 "반응형 고려" 명시했다면 더 빠른 진행 가능
- 접근성 요구사항 미리 언급했다면 SheetDescription 경고 방지 가능

### AI 협업 팁

1. **기획 단계부터 AI 활용**: 단순 코딩보다 옵션 제시 → 선택 패턴이 효율적
2. **TodoWrite 활용**: AI가 스스로 작업 계획을 세우고 추적하도록 유도
3. **Playwright MCP로 검증**: 구현 후 바로 시각적 테스트 가능

---

## 교훈

### 기술적 교훈

1. **useBreakpoint 훅 활용**: 반응형 컴포넌트 분기에 유용
2. **shadcn/ui Sheet + side="bottom"**: 모바일 Bottom Sheet 간편 구현
3. **SheetDescription 필수**: 접근성을 위해 항상 포함 (sr-only 가능)

### AI 협업 교훈

1. **옵션 제시 패턴이 효과적**: AI에게 여러 방안을 제시하게 하고 선택
2. **UX 관점 명시**: 기술적 구현뿐 아니라 사용자 경험 고려 요청
3. **단계적 검증**: 빌드 → 접근성 → 시각적 테스트 순서로 진행

---

## 관련 문서

- `CLAUDE.md` - 프로젝트 가이드 (미션 컴포넌트 섹션 추가됨)
- `TODO_NOTION_INTEGRATION.md` - Phase 7로 기록됨
