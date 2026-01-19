import { NotionRichText } from "../notion-rich-text";
import type { QuoteBlock } from "@/types/notion-blocks";

interface QuoteProps {
  block: QuoteBlock;
  children?: React.ReactNode;
}

export function Quote({ block, children }: QuoteProps) {
  return (
    <blockquote className="border-l-4 border-primary/50 pl-4 py-2 my-4 italic text-muted-foreground">
      <NotionRichText richText={block.quote.rich_text} />
      {children && <div className="mt-2 not-italic">{children}</div>}
    </blockquote>
  );
}
