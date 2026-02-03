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
 * - guidelines: 번호 리스트 (순서대로 따라하는 가이드)
 * - 나머지: 원본 Notion 타입 존중
 *
 * Note: example 섹션은 이미지와 리스트가 혼재되어 연속성이 끊기므로
 * 원본 타입을 존중하여 불릿/번호를 구분
 */
function getListStyleForSection(sectionType?: SectionType, originalType?: "bulleted" | "numbered"): "bulleted" | "numbered" {
  // guidelines 섹션만 번호 리스트로 통일
  if (sectionType === "guidelines") {
    return "numbered";
  }
  // 나머지는 원본 타입 존중
  return originalType ?? "bulleted";
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
    <li className="ml-6 leading-relaxed py-0.5">
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
 * sectionType이 지정되면 섹션에 맞는 스타일 적용
 * - guidelines → 번호 리스트 (1. 2. 3.)
 * - 나머지 → 원본 Notion 타입 존중 (bulleted/numbered)
 */
export function ListWrapper({ type, children, sectionType }: ListWrapperProps) {
  // sectionType과 원본 타입을 함께 고려
  const effectiveType = getListStyleForSection(sectionType, type);

  if (effectiveType === "bulleted") {
    return <ul className="list-disc space-y-2">{children}</ul>;
  }
  return <ol className="list-decimal space-y-2">{children}</ol>;
}
