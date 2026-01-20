# Notion 블록 UI 리팩토링 및 이미지 라이트박스 구현

> 작성일: 2026-01-20
> 관련 파일: `src/components/notion/blocks/*.tsx`, `docs/NOTION_BLOCK_UI_REFACTORING.md`
> 태그: #ui #refactoring #notion #lightbox #ux

## 배경 및 문제 상황

PBL 플랫폼의 미션 페이지는 Notion 블록을 그대로 렌더링하여 학습 자료를 표시합니다. 기존 UI는 기능적으로 동작하지만, 학습 자료로서의 가독성과 사용자 경험 측면에서 개선이 필요했습니다.

### 증상
- **Blockquote**: 핵심 문장인데 회색 + italic으로 오히려 덜 눈에 띔
- **Heading**: 번호 포함 헤딩(예: "1. 제목")이 일반 텍스트처럼 보임
- **Callout**: 기본 배경색만 적용, 아이콘 강조 부족
- **Code**: 파일명 표시 없음, 라인 넘버 없음
- **Image**: 전체 너비로 표시되어 너무 큼, 클릭하여 확대 기능 없음
- **Toggle**: 단순한 스타일, 애니메이션 없음

---

## AI 협업 흐름 (Prompting Log)

### 1단계: 문제 정의 및 현황 파악
**User Prompt:**
> "지금 우리 과제 페이지가 노션 블록을 그대로 가져오는 거잖아. 근데 너가 ui 디자인 적으로 한번 더 만져줄수 있는지 확인해줘"

**AI Response:**
- 기존 Notion 블록 렌더러 컴포넌트들을 분석
- `notion-block-renderer.tsx`와 `blocks/` 폴더 내 컴포넌트 구조 파악
- 각 블록 타입별 현재 스타일링 확인

### 2단계: 시각적 분석 요청
**User Prompt:**
> "엉 너가 화면 캡쳐해서 확인하면서 ui를 가독성 좋게, 근데 여기서 문제는 해당 ui가 어쨌든 학습 자료이기 때문에 문맥상 흐름이 맞게 해야해. playwrright로 화면 캡쳐하면서 확인가능한지 리팩토링 기획안 작성해줘"

**AI Response:**
- Playwright MCP를 활용하여 실제 페이지 스크린샷 캡처
- 미션 소개, 과제 목표, 구현 지침, 결과 예시 탭별 분석
- `docs/NOTION_BLOCK_UI_REFACTORING.md` 기획안 작성
- 학습 자료의 문맥적 흐름 유지 원칙 수립

### 3단계: 디자인 미리보기 요청
**User Prompt:**
> "음 예시 페이지 만들어줘 내가 먼저 디자인 확인하고 싶음"

**AI Response:**
- `src/app/demo/notion-ui/page.tsx` 데모 페이지 생성
- 각 블록 타입의 Before/After 비교 UI 구현
- 사용자가 직접 디자인을 확인할 수 있는 환경 제공

### 4단계: 디자인 피드백 반영
**User Prompt:**
> "인용문 디자인이 겹치는데 확인해서 수정"
> "인용문 디자인은 기존의 디자인으로 가져가주고 다시 디자인 시안 보여줘"

**AI Response:**
- Blockquote 디자인에서 아이콘 오버랩 문제 발견
- 사용자 피드백에 따라 기존 심플한 스타일 유지 결정
- 다른 컴포넌트들의 개선안만 적용

### 5단계: 실제 적용
**User Prompt:**
> "좋아 실제 컴포넌트에 적용해줘"

**AI Response:**
- `heading.tsx`: 번호 뱃지 스타일 추가
- `callout.tsx`: 이모지 기반 스타일링, 아이콘 배경 박스
- `code.tsx`: 파일명 헤더, 라인 넘버
- `toggle.tsx`: 카드 스타일, 애니메이션
- `image.tsx`: 카드 스타일, 캡션 아이콘

### 6단계: 이미지 크기 문제 해결
**User Prompt:**
> "사진 첨부가 너무 크게 들어가는데 사진 캡쳐하면서 확인해서 디자인적으로 괜찮은지 수정"

**AI Response:**
- Playwright로 결과 예시 탭 스크린샷 캡처
- 이미지가 전체 너비로 표시되는 문제 확인
- `max-w-2xl` 제한 추가로 1차 개선

### 7단계: 라이트박스 기능 추가
**User Prompt:**
> "사진 크기가 여전히 큰데 이거보다 작게해주고 차라리 클릭했을 때 원본 사이즈 크게 보이게 하는 창을 추가하는건 어떤지 생각해봐"

**AI Response:**
- 사용자의 제안을 수용하여 라이트박스 구현 결정
- 이미지 기본 크기 `max-w-md` (448px)로 축소
- 클릭 시 원본 크기로 볼 수 있는 라이트박스 모달 구현
- 호버 효과 (줌 아이콘), ESC/클릭으로 닫기 기능

---

## 기술적 분석

### 원인/배경 분석
1. **기존 블록 렌더러의 한계**: 기본 스타일만 적용되어 학습 자료로서의 시각적 계층 구조 부족
2. **이미지 크기 문제**: 콘솔 스크린샷 등이 전체 너비로 표시되어 불필요하게 큼
3. **인터랙션 부족**: 이미지 확대, 토글 애니메이션 등 사용자 인터랙션 요소 미비

### 해결 접근 방식
1. **컴포넌트별 개선**: 각 블록 타입의 역할에 맞는 시각적 스타일링
2. **문맥 기반 스타일링**: 이모지/색상 기반으로 콜아웃 유형 자동 감지
3. **점진적 공개**: 이미지는 작게 표시하고, 필요 시 라이트박스로 상세 확인

---

## 구현 내용

### 생성/수정된 파일
| 파일 | 변경 내용 |
|------|----------|
| `docs/NOTION_BLOCK_UI_REFACTORING.md` | 리팩토링 기획안 문서 |
| `src/app/demo/notion-ui/page.tsx` | 디자인 미리보기 데모 페이지 |
| `src/components/notion/blocks/heading.tsx` | 번호 뱃지 스타일 (heading_3) |
| `src/components/notion/blocks/callout.tsx` | 이모지 기반 스타일, 아이콘 배경 박스 |
| `src/components/notion/blocks/code.tsx` | 파일명 헤더, 라인 넘버, 복사 피드백 |
| `src/components/notion/blocks/image.tsx` | 크기 축소, 라이트박스 모달 |
| `src/components/notion/blocks/toggle.tsx` | 카드 스타일, 애니메이션 |

### 핵심 코드

**heading.tsx - 번호 뱃지 스타일:**
```tsx
function parseNumberedHeading(text: string): { number: string; title: string } | null {
  const match = text.match(/^(\d+)\.\s*(.+)$/);
  if (match) {
    return { number: match[1], title: match[2] };
  }
  return null;
}

// heading_3에서 번호 감지 시:
<h3 className="flex items-center gap-3 mt-8 mb-4">
  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-sm">
    {parsed.number}
  </span>
  <span className="text-lg font-semibold">{parsed.title}</span>
</h3>
```

**callout.tsx - 이모지 기반 스타일 감지:**
```tsx
function getCalloutStyles(color: string, emoji: string | null): CalloutStyles {
  // 이모지 기반 스타일 결정
  if (emoji === "💡" || emoji === "✨" || emoji === "📌") {
    return { /* Tip 스타일 - 파란색 */ };
  }
  if (emoji === "⚠️" || emoji === "❗" || emoji === "🚨") {
    return { /* Warning 스타일 - 노란색 */ };
  }
  if (emoji === "⭐" || emoji === "🌟" || emoji === "🎯") {
    return { /* Bonus 스타일 - 보라색 */ };
  }
  // 색상 기반 폴백...
}
```

**image.tsx - 라이트박스 구현:**
```tsx
// 이미지 컴포넌트
<figure className="my-6 max-w-md mx-auto">
  <button onClick={() => setIsLightboxOpen(true)} className="relative w-full group cursor-zoom-in">
    <img src={imageUrl} className="w-full h-auto transition-transform group-hover:scale-[1.02]" />
    {/* 호버 시 줌 아이콘 표시 */}
    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
      <div className="opacity-0 group-hover:opacity-100 bg-white/90 rounded-full p-2">
        <ZoomIn className="w-5 h-5" />
      </div>
    </div>
  </button>
</figure>

// 라이트박스 모달
function Lightbox({ imageUrl, caption, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <img src={imageUrl} className="max-w-[90vw] max-h-[85vh] object-contain" />
    </div>
  );
}
```

---

## 검증

### 테스트 방법
1. Playwright MCP로 실제 페이지 스크린샷 캡처
2. 각 탭(미션 소개, 결과 예시 등)에서 개선된 UI 확인
3. 이미지 클릭 시 라이트박스 동작 테스트
4. ESC 키로 라이트박스 닫기 테스트

### 결과
- 스크린샷 파일: `.playwright-mcp/image-with-lightbox.png`, `.playwright-mcp/lightbox-open.png`
- 모든 컴포넌트 개선 사항 정상 동작 확인
- 라이트박스 열기/닫기 정상 동작

---

## 프롬프팅 인사이트

### 효과적이었던 프롬프트 패턴

1. **시각적 확인 요청**: "playwrright로 화면 캡쳐하면서 확인"
   - AI가 실제 UI를 직접 확인하며 분석할 수 있어 정확한 문제 파악 가능

2. **미리보기 요청**: "예시 페이지 만들어줘 내가 먼저 디자인 확인하고 싶음"
   - 실제 적용 전 디자인 검토 가능, 리스크 최소화

3. **대안 제시 요청**: "차라리 클릭했을 때 원본 사이즈 크게 보이게 하는 창을 추가하는건 어떤지 생각해봐"
   - AI에게 단순 수정이 아닌 더 나은 UX 솔루션을 제안하도록 유도

### 개선할 수 있는 점
- 초기에 모바일/데스크톱 반응형 요구사항을 명시했으면 더 효율적이었을 것
- 디자인 시스템(색상, 간격 등)의 기준을 미리 정의했으면 일관성 향상

### AI 협업 팁
1. **점진적 확인**: 한 번에 모든 변경을 적용하지 않고, 단계별로 확인하며 진행
2. **시각적 피드백 활용**: Playwright로 실제 화면을 캡처하여 AI와 공유
3. **사용자 주도 의사결정**: 핵심 디자인 결정(예: blockquote 스타일 유지)은 사용자가 직접 결정

---

## 교훈

### 기술적 교훈
1. **CSS Grid 애니메이션**: `grid-rows-[0fr]` → `grid-rows-[1fr]` 트랜지션으로 부드러운 높이 애니메이션 구현
2. **라이트박스 UX**: ESC 키, 배경 클릭, X 버튼 등 다양한 닫기 방법 제공이 중요
3. **이미지 크기 전략**: 기본 작게, 클릭 시 크게 보는 패턴이 스크롤 감소와 상세 확인 모두 만족

### AI 협업 교훈
1. **미리보기 환경 구축**: 실제 적용 전 데모 페이지로 검토하면 수정 비용 절감
2. **사용자 피드백 즉시 반영**: "기존 디자인으로 가져가줘" 같은 피드백에 유연하게 대응
3. **대안 제시 유도**: 단순 수정 요청보다 "어떤지 생각해봐" 형태로 AI의 제안을 유도하면 더 나은 솔루션 도출
