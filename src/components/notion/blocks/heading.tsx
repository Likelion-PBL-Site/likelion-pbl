import { NotionRichText } from "../notion-rich-text";
import type {
  Heading1Block,
  Heading2Block,
  Heading3Block,
} from "@/types/notion-blocks";

type HeadingBlock = Heading1Block | Heading2Block | Heading3Block;

interface HeadingProps {
  block: HeadingBlock;
}

/**
 * "1. 제목" 또는 "1. 제목 - 부제목" 형태에서 번호와 제목을 분리
 */
function parseNumberedHeading(text: string): { number: string; title: string } | null {
  const match = text.match(/^(\d+)\.\s*(.+)$/);
  if (match) {
    return { number: match[1], title: match[2] };
  }
  return null;
}

/**
 * RichText 배열에서 plain text 추출
 */
function getPlainText(richText: { plain_text: string }[]): string {
  return richText.map((t) => t.plain_text).join("");
}

export function Heading({ block }: HeadingProps) {
  switch (block.type) {
    case "heading_1":
      return (
        <h1 className="text-2xl font-bold mt-8 mb-4">
          <NotionRichText richText={block.heading_1.rich_text} />
        </h1>
      );
    case "heading_2":
      return (
        <h2 className="text-xl font-semibold mt-6 mb-3">
          <NotionRichText richText={block.heading_2.rich_text} />
        </h2>
      );
    case "heading_3": {
      const plainText = getPlainText(block.heading_3.rich_text);
      const parsed = parseNumberedHeading(plainText);

      // 번호가 있는 경우 뱃지 스타일
      if (parsed) {
        return (
          <h3 className="flex items-center gap-3 mt-8 mb-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-sm">
              {parsed.number}
            </span>
            <span className="text-lg font-semibold">{parsed.title}</span>
          </h3>
        );
      }

      // 일반 heading_3
      return (
        <h3 className="text-lg font-medium mt-6 mb-3">
          <NotionRichText richText={block.heading_3.rich_text} />
        </h3>
      );
    }
  }
}
