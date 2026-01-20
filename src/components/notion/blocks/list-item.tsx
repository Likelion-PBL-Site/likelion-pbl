import { NotionRichText } from "../notion-rich-text";
import type {
  BulletedListItemBlock,
  NumberedListItemBlock,
} from "@/types/notion-blocks";

/**
 * 섹션 타입 정의
 * 각 섹션에 맞는 리스트 스타일이 적용됨
 */
export type SectionType =
  | "introduction"  // 불릿
  | "objective"     // 불릿
  | "result"        // 불릿
  | "timeGoal"      // 불릿
  | "guidelines"    // 번호 (순서대로 따라하는 가이드)
  | "example"       // 번호 (예시 순서)
  | "constraints"   // 불릿
  | "bonus";        // 불릿

/**
 * 섹션 타입에 따른 리스트 스타일 결정
 * guidelines, example은 순서가 중요하므로 번호 리스트
 * 나머지는 불릿 리스트로 통일
 */
function getListStyleForSection(sectionType?: SectionType): "bulleted" | "numbered" {
  if (sectionType === "guidelines" || sectionType === "example") {
    return "numbered";
  }
  return "bulleted";
}

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
  /** 섹션 타입이 지정되면 Notion 원본 타입을 무시하고 섹션에 맞는 스타일 적용 */
  sectionType?: SectionType;
}

/**
 * 리스트 아이템을 감싸는 ul/ol 래퍼
 * sectionType이 지정되면 섹션에 맞는 스타일로 통일
 * - guidelines, example → 번호 리스트 (1. 2. 3.)
 * - 나머지 → 불릿 리스트 (●)
 */
export function ListWrapper({ type, children, sectionType }: ListWrapperProps) {
  // sectionType이 있으면 섹션 스타일 우선, 없으면 Notion 원본 타입 사용
  const effectiveType = sectionType ? getListStyleForSection(sectionType) : type;

  if (effectiveType === "bulleted") {
    return <ul className="list-disc space-y-1">{children}</ul>;
  }
  return <ol className="list-decimal space-y-1">{children}</ol>;
}
