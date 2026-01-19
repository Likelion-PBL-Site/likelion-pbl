import { NotionRichText } from "../notion-rich-text";
import type { ParagraphBlock } from "@/types/notion-blocks";

interface ParagraphProps {
  block: ParagraphBlock;
}

export function Paragraph({ block }: ParagraphProps) {
  const { rich_text } = block.paragraph;

  // 빈 paragraph는 빈 줄로 표시
  if (!rich_text || rich_text.length === 0) {
    return <div className="h-4" />;
  }

  return (
    <p className="leading-7">
      <NotionRichText richText={rich_text} />
    </p>
  );
}
