import { NotionRichText } from "../notion-rich-text";
import type {
  BulletedListItemBlock,
  NumberedListItemBlock,
} from "@/types/notion-blocks";

type ListItemBlock = BulletedListItemBlock | NumberedListItemBlock;

interface ListItemProps {
  block: ListItemBlock;
  children?: React.ReactNode;
}

export function ListItem({ block, children }: ListItemProps) {
  const isBulleted = block.type === "bulleted_list_item";
  const richText = isBulleted
    ? block.bulleted_list_item.rich_text
    : block.numbered_list_item.rich_text;

  return (
    <li className="ml-6 leading-7">
      <NotionRichText richText={richText} />
      {children && <div className="mt-1">{children}</div>}
    </li>
  );
}

interface ListWrapperProps {
  type: "bulleted" | "numbered";
  children: React.ReactNode;
}

/**
 * 리스트 아이템을 감싸는 ul/ol 래퍼
 * notion-block-renderer에서 연속된 리스트 아이템을 그룹화할 때 사용
 */
export function ListWrapper({ type, children }: ListWrapperProps) {
  if (type === "bulleted") {
    return <ul className="list-disc space-y-1">{children}</ul>;
  }
  return <ol className="list-decimal space-y-1">{children}</ol>;
}
