import { NotionRichText } from "../notion-rich-text";
import type { CalloutBlock } from "@/types/notion-blocks";

interface CalloutProps {
  block: CalloutBlock;
  children?: React.ReactNode;
}

export function Callout({ block, children }: CalloutProps) {
  const { icon, rich_text, color } = block.callout;

  // 아이콘 렌더링
  const iconContent = icon?.type === "emoji" ? icon.emoji : null;

  // 배경색 클래스
  const bgClass = getCalloutBgClass(color);

  return (
    <div
      className={`flex gap-3 p-4 rounded-lg my-4 ${bgClass}`}
    >
      {iconContent && (
        <span className="text-xl flex-shrink-0">{iconContent}</span>
      )}
      <div className="flex-1 min-w-0">
        <NotionRichText richText={rich_text} />
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  );
}

function getCalloutBgClass(color: string): string {
  const colorMap: Record<string, string> = {
    default: "bg-muted",
    gray_background: "bg-gray-100 dark:bg-gray-800",
    brown_background: "bg-amber-50 dark:bg-amber-900/20",
    orange_background: "bg-orange-50 dark:bg-orange-900/20",
    yellow_background: "bg-yellow-50 dark:bg-yellow-900/20",
    green_background: "bg-green-50 dark:bg-green-900/20",
    blue_background: "bg-blue-50 dark:bg-blue-900/20",
    purple_background: "bg-purple-50 dark:bg-purple-900/20",
    pink_background: "bg-pink-50 dark:bg-pink-900/20",
    red_background: "bg-red-50 dark:bg-red-900/20",
  };

  return colorMap[color] || colorMap.default;
}
