"use client";

import type { NotionBlock } from "@/types/notion-blocks";
import { Paragraph } from "./blocks/paragraph";
import { Heading } from "./blocks/heading";
import { ListItem, ListWrapper, type SectionType } from "./blocks/list-item";
import { Quote } from "./blocks/quote";
import { Callout } from "./blocks/callout";
import { Toggle } from "./blocks/toggle";
import { Code } from "./blocks/code";
import { NotionImage } from "./blocks/image";
import { Divider } from "./blocks/divider";

interface NotionBlockRendererProps {
  blocks: NotionBlock[];
  /** 섹션 타입에 따라 리스트 스타일 통일 */
  sectionType?: SectionType;
  /** 체크된 블록 ID Set (guidelines 섹션용) */
  checkedIds?: Set<string>;
  /** 체크 토글 콜백 */
  onToggleCheck?: (blockId: string) => void;
}

/**
 * Notion 블록 배열을 렌더링하는 메인 컴포넌트
 * 연속된 리스트 아이템을 그룹화하고 재귀적으로 children을 렌더링
 * sectionType에 따라 리스트 스타일이 통일됨
 */
export function NotionBlockRenderer({
  blocks,
  sectionType,
  checkedIds,
  onToggleCheck,
}: NotionBlockRendererProps) {
  const groupedBlocks = groupListItems(blocks);

  return (
    <div className="notion-content space-y-2">
      {groupedBlocks.map((item, index) => {
        if (item.type === "list-group") {
          return (
            <ListWrapper key={index} type={item.listType} sectionType={sectionType}>
              {item.blocks.map((block) => (
                <RenderBlock
                  key={block.id}
                  block={block}
                  sectionType={sectionType}
                  checkedIds={checkedIds}
                  onToggleCheck={onToggleCheck}
                />
              ))}
            </ListWrapper>
          );
        }
        return (
          <RenderBlock
            key={item.block.id}
            block={item.block}
            sectionType={sectionType}
            checkedIds={checkedIds}
            onToggleCheck={onToggleCheck}
          />
        );
      })}
    </div>
  );
}

interface RenderBlockProps {
  block: NotionBlock;
  sectionType?: SectionType;
  checkedIds?: Set<string>;
  onToggleCheck?: (blockId: string) => void;
}

/**
 * 단일 블록을 렌더링하고 children이 있으면 재귀 호출
 */
function RenderBlock({ block, sectionType, checkedIds, onToggleCheck }: RenderBlockProps) {
  const children = hasChildren(block) ? (
    <NotionBlockRenderer
      blocks={block.children}
      sectionType={sectionType}
      checkedIds={checkedIds}
      onToggleCheck={onToggleCheck}
    />
  ) : null;

  switch (block.type) {
    case "paragraph":
      return <Paragraph block={block} />;

    case "heading_1":
    case "heading_2":
      return <Heading block={block} />;

    case "heading_3":
      // guidelines 섹션에서는 heading_3에 체크박스 추가
      if (sectionType === "guidelines" && checkedIds && onToggleCheck) {
        return (
          <Heading
            block={block}
            isCheckable
            isChecked={checkedIds.has(block.id)}
            onToggle={onToggleCheck}
          />
        );
      }
      return <Heading block={block} />;

    case "bulleted_list_item":
    case "numbered_list_item":
      return <ListItem block={block}>{children}</ListItem>;

    case "quote":
      return <Quote block={block}>{children}</Quote>;

    case "callout":
      return <Callout block={block}>{children}</Callout>;

    case "toggle":
      return <Toggle block={block}>{children}</Toggle>;

    case "code":
      return <Code block={block} />;

    case "image":
      return <NotionImage block={block} />;

    case "divider":
      return <Divider />;

    case "table_of_contents":
      // 목차는 앱에서 별도로 처리하므로 무시
      return null;

    default:
      // 지원하지 않는 블록 타입
      if (process.env.NODE_ENV === "development") {
        console.warn(`Unsupported block type: ${block.type}`);
      }
      return null;
  }
}

/**
 * 블록에 children이 있는지 확인
 */
function hasChildren(
  block: NotionBlock
): block is NotionBlock & { children: NotionBlock[] } {
  return "children" in block && Array.isArray(block.children);
}

// --- 리스트 그룹화 유틸리티 ---

type ListType = "bulleted" | "numbered";

type GroupedItem =
  | { type: "single"; block: NotionBlock }
  | { type: "list-group"; listType: ListType; blocks: NotionBlock[] };

/**
 * 연속된 리스트 아이템을 그룹화
 * bulleted_list_item, bulleted_list_item → ul로 묶음
 */
function groupListItems(blocks: NotionBlock[]): GroupedItem[] {
  const result: GroupedItem[] = [];
  let currentListGroup: { listType: ListType; blocks: NotionBlock[] } | null =
    null;

  for (const block of blocks) {
    const listType = getListType(block);

    if (listType) {
      // 리스트 아이템인 경우
      if (currentListGroup && currentListGroup.listType === listType) {
        // 같은 타입의 리스트가 진행 중이면 추가
        currentListGroup.blocks.push(block);
      } else {
        // 새로운 리스트 그룹 시작
        if (currentListGroup) {
          result.push({ type: "list-group", ...currentListGroup });
        }
        currentListGroup = { listType, blocks: [block] };
      }
    } else {
      // 리스트 아이템이 아닌 경우
      if (currentListGroup) {
        result.push({ type: "list-group", ...currentListGroup });
        currentListGroup = null;
      }
      result.push({ type: "single", block });
    }
  }

  // 마지막 리스트 그룹 처리
  if (currentListGroup) {
    result.push({ type: "list-group", ...currentListGroup });
  }

  return result;
}

function getListType(block: NotionBlock): ListType | null {
  if (block.type === "bulleted_list_item") return "bulleted";
  if (block.type === "numbered_list_item") return "numbered";
  return null;
}
