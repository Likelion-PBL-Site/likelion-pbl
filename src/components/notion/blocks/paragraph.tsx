import { NotionRichText } from "../notion-rich-text";
import type { ParagraphBlock } from "@/types/notion-blocks";

interface ParagraphProps {
  block: ParagraphBlock;
  children?: React.ReactNode;
}

export function Paragraph({ block, children }: ParagraphProps) {
  const { rich_text } = block.paragraph;

  // 빈 paragraph이면서 children이 있으면 children만 렌더링
  if (!rich_text || rich_text.length === 0) {
    if (children) {
      return <div className="pl-4">{children}</div>;
    }
    return <div className="h-4" />;
  }

  return (
    <div>
      <p className="leading-relaxed text-muted-foreground">
        <NotionRichText richText={rich_text} />
      </p>
      {children && <div className="pl-4 mt-2">{children}</div>}
    </div>
  );
}
