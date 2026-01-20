# Notion 블록 렌더러 UI 리팩토링 기획안

> 학습 자료의 **문맥적 흐름**을 유지하면서 **가독성**을 개선하는 방향

## 현재 상태 분석

### 스크린샷 기반 분석 (2026-01-20)

| 탭 | 현재 상태 | 문제점 |
|----|----------|--------|
| 미션 소개 | blockquote + paragraph | quote가 단순 왼쪽 라인만, 문단 간격 촘촘 |
| 과제 목표 | blockquote + 리스트 | 리스트 마커 밋밋, 학습 목표 강조 부족 |
| 구현 지침 | heading_3 + 리스트 + separator | 섹션 간 구분 모호, 번호 헤딩 스타일 단조 |
| 결과 예시 | heading_3 + 이미지 | 이미지-설명 연결성 부족, 캡션 스타일 미흡 |
| 제약/보너스 | 리스트 형태 | 중요도 구분 없음 |

### 현재 컴포넌트 구조

```
src/components/notion/
├── notion-block-renderer.tsx  # 메인 렌더러 (space-y-2)
├── notion-rich-text.tsx       # RichText (bold, italic, code, link 등)
└── blocks/
    ├── paragraph.tsx          # leading-7
    ├── heading.tsx            # text-2xl/xl/lg, mt-8/6/4
    ├── list-item.tsx          # list-disc/decimal, ml-6
    ├── quote.tsx              # border-l-4, italic
    ├── callout.tsx            # 배경색 매핑, 아이콘
    ├── toggle.tsx             # ChevronRight, 확장/접기
    ├── code.tsx               # Shiki, 복사 버튼
    ├── image.tsx              # 프록시, 캡션
    └── divider.tsx            # separator
```

---

## 리팩토링 원칙

### 1. 학습 자료 문맥 흐름 유지

```
도입(왜?) → 목표(무엇을?) → 지침(어떻게?) → 예시(확인) → 제약(주의)
```

- 각 섹션의 **역할**이 시각적으로 구분되어야 함
- 순차적 읽기 흐름 방해 요소 최소화
- **핵심 정보**와 **부가 설명** 간 계층 구조 명확화

### 2. 적정 정보 밀도

- 너무 빽빽하면 피로감 → 적절한 여백
- 너무 넓으면 맥락 단절 → 관련 요소는 가깝게

### 3. 일관된 시각 언어

- 같은 역할 = 같은 스타일
- 예: 모든 "핵심 문장"은 동일한 quote 스타일

---

## 상세 개선 계획

### 1. Blockquote (인용문) - `quote.tsx`

**현재:**
```tsx
<blockquote className="border-l-4 border-primary/50 pl-4 py-2 my-4 italic text-muted-foreground">
```

**문제:** 핵심 문장인데 회색 + italic으로 오히려 덜 눈에 띔

**개선안:**
```tsx
<blockquote className="relative pl-6 py-4 my-6
  bg-gradient-to-r from-primary/5 to-transparent
  border-l-4 border-primary
  rounded-r-lg">
  <QuoteIcon className="absolute -left-3 -top-2 text-primary/20 w-8 h-8" />
  <p className="text-lg font-medium text-foreground leading-relaxed">
    {content}
  </p>
</blockquote>
```

**변경 포인트:**
- 배경 그라데이션 추가 (시선 집중)
- italic 제거, font-medium으로 강조
- 인용 아이콘 장식 (선택적)
- text-muted → text-foreground

---

### 2. Heading (제목) - `heading.tsx`

**현재 문제:** 번호 포함 헤딩(예: "1. 아기사자 수 입력")이 일반 텍스트처럼 보임

**개선안 A - 번호 뱃지 스타일:**
```tsx
// "1. 제목" 형태 감지 시
<h3 className="flex items-center gap-3 mt-8 mb-4">
  <span className="flex-shrink-0 w-8 h-8 rounded-full
    bg-primary text-primary-foreground
    flex items-center justify-center text-sm font-bold">
    1
  </span>
  <span className="text-lg font-semibold">아기사자 수 입력</span>
</h3>
```

**개선안 B - 왼쪽 라인 + 배경:**
```tsx
<h3 className="pl-4 py-2 mt-8 mb-4
  border-l-4 border-primary
  bg-muted/30 rounded-r-lg
  text-lg font-semibold">
  1. 아기사자 수 입력
</h3>
```

**추천:** 구현 지침 탭의 단계별 구조에는 **개선안 A** 적용
- 학습 순서가 명확해짐
- 번호가 시각적으로 분리되어 탐색 용이

---

### 3. List (리스트) - `list-item.tsx`

**현재:** 기본 disc/decimal, ml-6

**개선안 - 학습 목표 스타일:**
```tsx
// 과제 목표 탭의 리스트 (학습 목표)
<li className="flex items-start gap-3 py-2">
  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
  <span className="leading-7">{content}</span>
</li>
```

**개선안 - 요구사항 스타일:**
```tsx
// 구현 지침 탭의 리스트 (요구사항)
<li className="flex items-start gap-3 py-1.5
  pl-4 border-l-2 border-muted hover:border-primary
  transition-colors">
  <span className="leading-7">{content}</span>
</li>
```

**구현 방법:**
- NotionBlockRenderer에 `context` prop 추가
- 현재 탭/섹션에 따라 리스트 스타일 분기

---

### 4. Callout (콜아웃) - `callout.tsx`

**현재:** 기본 배경색만 적용

**개선안:**
```tsx
<div className={cn(
  "flex gap-4 p-5 my-6 rounded-xl",
  "border border-l-4",
  bgClass,
  borderClass, // 왼쪽 강조 라인
  "shadow-sm"
)}>
  {iconContent && (
    <div className="flex-shrink-0 w-10 h-10 rounded-lg
      bg-background/50 flex items-center justify-center text-2xl">
      {iconContent}
    </div>
  )}
  <div className="flex-1 min-w-0 space-y-2">
    <NotionRichText richText={rich_text} />
    {children}
  </div>
</div>
```

**변경 포인트:**
- 아이콘 배경 박스 추가
- 왼쪽 강조 라인 (border-l-4)
- 미세한 그림자로 입체감
- 내부 여백 증가 (p-4 → p-5)

---

### 5. Code Block (코드 블록) - `code.tsx`

**현재 상태:** Shiki + github-dark 테마, 복사 버튼 있음 ✓

**추가 개선안:**

```tsx
// 라인 넘버 옵션
<div className="flex">
  <div className="select-none pr-4 text-right text-muted-foreground/50
    border-r border-muted">
    {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
  </div>
  <div className="pl-4 flex-1">{code}</div>
</div>
```

**파일명 표시:**
```tsx
// 캡션을 파일명으로 활용
{caption && (
  <div className="px-4 py-1.5 text-xs font-mono
    bg-muted/80 border-b border-border
    flex items-center gap-2">
    <FileCode className="w-3.5 h-3.5" />
    {caption}
  </div>
)}
```

---

### 6. Image (이미지) - `image.tsx`

**현재 문제:** 이미지와 설명 텍스트 연결성 부족

**개선안 - 카드 스타일:**
```tsx
<figure className="my-6 rounded-xl overflow-hidden
  border border-border bg-card shadow-sm">
  <div className="relative">
    <img
      src={imageUrl}
      alt={caption || "Notion 이미지"}
      className="w-full h-auto"
      loading="lazy"
    />
    {/* 확대 버튼 (선택적) */}
    <button className="absolute top-2 right-2 p-2 rounded-lg
      bg-background/80 backdrop-blur hover:bg-background
      opacity-0 group-hover:opacity-100 transition-opacity">
      <Maximize2 className="w-4 h-4" />
    </button>
  </div>
  {caption && (
    <figcaption className="px-4 py-3 text-sm text-muted-foreground
      bg-muted/30 border-t border-border
      flex items-center gap-2">
      <Info className="w-4 h-4 flex-shrink-0" />
      {caption}
    </figcaption>
  )}
</figure>
```

**Lightbox 기능:**
- 클릭 시 모달로 확대
- 모바일에서 특히 유용
- 라이브러리: `yet-another-react-lightbox` 또는 직접 구현

---

### 7. Separator (구분선) - `divider.tsx`

**현재:** 단순 `<hr>`

**개선안 - 섹션 간 구분:**
```tsx
// 일반 separator
<hr className="my-6 border-muted" />

// 주요 섹션 구분 (연속 separator 감지 시)
<div className="my-10 flex items-center gap-4">
  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
  <div className="w-2 h-2 rounded-full bg-muted" />
  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
</div>
```

---

### 8. 전체 레이아웃 - `notion-block-renderer.tsx`

**현재:** `space-y-2` (8px 간격)

**개선안 - 블록 타입별 간격:**
```tsx
function getBlockMargin(block: NotionBlock, nextBlock?: NotionBlock): string {
  // 헤딩 앞에는 큰 간격
  if (nextBlock?.type.startsWith('heading')) {
    return 'mb-8';
  }
  // 코드/이미지 앞뒤는 중간 간격
  if (block.type === 'code' || block.type === 'image') {
    return 'my-6';
  }
  // 연속 paragraph는 작은 간격
  if (block.type === 'paragraph' && nextBlock?.type === 'paragraph') {
    return 'mb-4';
  }
  return 'mb-4';
}
```

**prose 스타일 적용 고려:**
```tsx
<div className="notion-content prose prose-slate dark:prose-invert
  prose-headings:font-semibold
  prose-p:leading-7
  prose-li:leading-7
  max-w-none">
```

---

## 문맥 흐름 강화 방안

### 탭별 시각적 테마

| 탭 | 역할 | 시각적 단서 |
|----|------|------------|
| 미션 소개 | Why (동기 부여) | 따뜻한 톤, 큰 인용문 |
| 과제 목표 | What (목표 설정) | 체크리스트 스타일, 녹색 악센트 |
| 구현 지침 | How (단계별 안내) | 번호 뱃지, 진행 흐름 강조 |
| 결과 예시 | Reference (참고) | 이미지 카드, 캡션 강조 |
| 제약 사항 | Warning (주의) | 경고 아이콘, 노란색 악센트 |
| 보너스 | Extra (도전) | 별 아이콘, 보라색 악센트 |

### 진행 표시자 (선택적)

구현 지침 탭에서 현재 읽고 있는 섹션 표시:
```tsx
<div className="sticky top-0 bg-background/80 backdrop-blur
  py-2 border-b border-border z-10">
  <div className="flex gap-2">
    {sections.map((s, i) => (
      <div
        key={i}
        className={cn(
          "h-1 flex-1 rounded-full",
          i <= currentSection ? "bg-primary" : "bg-muted"
        )}
      />
    ))}
  </div>
</div>
```

---

## 구현 우선순위

### Phase 1: 핵심 가독성 (High Impact)
1. **Blockquote 개선** - 핵심 문장 강조
2. **Heading 개선** - 번호 뱃지 스타일
3. **전체 간격 조정** - 블록 타입별 margin

### Phase 2: 리스트 개선 (Medium Impact)
4. **List 스타일 분기** - 목표/요구사항 구분
5. **Callout 개선** - 아이콘 배경, 입체감

### Phase 3: 미디어 개선 (Nice to Have)
6. **Image 카드 스타일** - 캡션 개선
7. **Code 라인 넘버** - 선택적
8. **Lightbox** - 이미지 확대

### Phase 4: 고급 기능 (Future)
9. **탭별 테마 색상**
10. **진행 표시자**
11. **애니메이션** (toggle 확장 등)

---

## 파일 변경 계획

```
src/components/notion/
├── notion-block-renderer.tsx  # 간격 로직 추가
├── notion-rich-text.tsx       # (변경 없음)
└── blocks/
    ├── paragraph.tsx          # leading-relaxed
    ├── heading.tsx            # 번호 뱃지 로직 추가
    ├── list-item.tsx          # context 기반 스타일 분기
    ├── quote.tsx              # ⭐ 전면 개선
    ├── callout.tsx            # 아이콘 배경, 그림자
    ├── toggle.tsx             # 애니메이션 추가
    ├── code.tsx               # 파일명 표시, 라인 넘버
    ├── image.tsx              # ⭐ 카드 스타일 + Lightbox
    └── divider.tsx            # 그라데이션 옵션
```

---

## 주의사항

1. **기존 스타일 호환** - 기존 캐시된 데이터와 호환 유지
2. **다크 모드** - 모든 개선사항 다크 모드 테스트
3. **모바일 반응형** - 모바일에서 터치 영역, 폰트 크기 확인
4. **성능** - Lightbox 등 추가 기능은 lazy load

---

## 참고 디자인

- [Notion 공식 렌더링](https://notion.so)
- [GitBook](https://docs.gitbook.com)
- [Docusaurus](https://docusaurus.io)
- [Tailwind Typography](https://tailwindcss.com/docs/typography-plugin)
