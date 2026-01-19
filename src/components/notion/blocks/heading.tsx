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
    case "heading_3":
      return (
        <h3 className="text-lg font-medium mt-4 mb-2">
          <NotionRichText richText={block.heading_3.rich_text} />
        </h3>
      );
  }
}
