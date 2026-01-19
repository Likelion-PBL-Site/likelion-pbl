/**
 * Notion Blocks API 타입 정의
 */

/** RichText 어노테이션 */
export interface RichTextAnnotations {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  underline: boolean;
  code: boolean;
  color: string;
}

/** RichText 기본 타입 */
export interface RichTextItem {
  type: "text" | "mention" | "equation";
  text?: {
    content: string;
    link: { url: string } | null;
  };
  annotations: RichTextAnnotations;
  plain_text: string;
  href: string | null;
}

/** 블록 기본 타입 */
export interface NotionBlockBase {
  object: "block";
  id: string;
  type: string;
  created_time: string;
  last_edited_time: string;
  has_children: boolean;
  archived: boolean;
}

/** Paragraph 블록 */
export interface ParagraphBlock extends NotionBlockBase {
  type: "paragraph";
  paragraph: {
    rich_text: RichTextItem[];
    color: string;
  };
}

/** Heading 1 블록 */
export interface Heading1Block extends NotionBlockBase {
  type: "heading_1";
  heading_1: {
    rich_text: RichTextItem[];
    color: string;
    is_toggleable: boolean;
  };
  children?: NotionBlock[]; // 토글 헤딩인 경우
}

/** Heading 2 블록 */
export interface Heading2Block extends NotionBlockBase {
  type: "heading_2";
  heading_2: {
    rich_text: RichTextItem[];
    color: string;
    is_toggleable: boolean;
  };
  children?: NotionBlock[]; // 토글 헤딩인 경우
}

/** Heading 3 블록 */
export interface Heading3Block extends NotionBlockBase {
  type: "heading_3";
  heading_3: {
    rich_text: RichTextItem[];
    color: string;
    is_toggleable: boolean;
  };
  children?: NotionBlock[]; // 토글 헤딩인 경우
}

/** Bulleted List Item 블록 */
export interface BulletedListItemBlock extends NotionBlockBase {
  type: "bulleted_list_item";
  bulleted_list_item: {
    rich_text: RichTextItem[];
    color: string;
  };
  children?: NotionBlock[];
}

/** Numbered List Item 블록 */
export interface NumberedListItemBlock extends NotionBlockBase {
  type: "numbered_list_item";
  numbered_list_item: {
    rich_text: RichTextItem[];
    color: string;
  };
  children?: NotionBlock[];
}

/** Quote 블록 */
export interface QuoteBlock extends NotionBlockBase {
  type: "quote";
  quote: {
    rich_text: RichTextItem[];
    color: string;
  };
  children?: NotionBlock[];
}

/** Callout 블록 */
export interface CalloutBlock extends NotionBlockBase {
  type: "callout";
  callout: {
    rich_text: RichTextItem[];
    icon: {
      type: "emoji" | "external" | "file";
      emoji?: string;
      external?: { url: string };
      file?: { url: string };
    } | null;
    color: string;
  };
  children?: NotionBlock[];
}

/** Code 블록 */
export interface CodeBlock extends NotionBlockBase {
  type: "code";
  code: {
    rich_text: RichTextItem[];
    language: string;
    caption: RichTextItem[];
  };
}

/** Image 블록 */
export interface ImageBlock extends NotionBlockBase {
  type: "image";
  image: {
    type: "file" | "external";
    file?: {
      url: string;
      expiry_time: string;
    };
    external?: {
      url: string;
    };
    caption: RichTextItem[];
  };
}

/** Divider 블록 */
export interface DividerBlock extends NotionBlockBase {
  type: "divider";
  divider: Record<string, never>;
}

/** Toggle 블록 */
export interface ToggleBlock extends NotionBlockBase {
  type: "toggle";
  toggle: {
    rich_text: RichTextItem[];
    color: string;
  };
  children?: NotionBlock[];
}

/** Table of Contents 블록 */
export interface TableOfContentsBlock extends NotionBlockBase {
  type: "table_of_contents";
  table_of_contents: {
    color: string;
  };
}

/** Bookmark 블록 */
export interface BookmarkBlock extends NotionBlockBase {
  type: "bookmark";
  bookmark: {
    url: string;
    caption: RichTextItem[];
  };
}

/** 모든 블록 타입 Union */
export type NotionBlock =
  | ParagraphBlock
  | Heading1Block
  | Heading2Block
  | Heading3Block
  | BulletedListItemBlock
  | NumberedListItemBlock
  | QuoteBlock
  | CalloutBlock
  | CodeBlock
  | ImageBlock
  | DividerBlock
  | ToggleBlock
  | TableOfContentsBlock
  | BookmarkBlock;

/** 섹션별 블록 그룹 */
export interface MissionSections {
  introduction: NotionBlock[];
  objective: NotionBlock[];
  result: NotionBlock[];
  timeGoal: NotionBlock[];
  guidelines: NotionBlock[];
  example: NotionBlock[];
  constraints: NotionBlock[];
  bonus: NotionBlock[];
}

/** 섹션 키 타입 */
export type SectionKey = keyof MissionSections;

/** 섹션 매핑 (Notion 헤딩 텍스트 → 섹션 키) */
export const sectionMapping: Record<string, SectionKey> = {
  "1. 미션 소개": "introduction",
  "2. 과제 목표": "objective",
  "3. 최종 결과물": "result",
  "4. 목표 수행 시간": "timeGoal",
  "5. 기능 요구 사항": "guidelines",
  "6. 결과 예시": "example",
  "7. 제약 사항": "constraints",
  "8. 보너스 과제": "bonus",
};
