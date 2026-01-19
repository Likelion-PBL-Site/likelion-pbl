import { cn } from "@/lib/utils";
import type { RichTextItem } from "@/types/notion-blocks";

interface NotionRichTextProps {
  richText: RichTextItem[];
  className?: string;
}

/**
 * Notion RichText 렌더러
 * bold, italic, strikethrough, underline, code, link 등 처리
 */
export function NotionRichText({ richText, className }: NotionRichTextProps) {
  if (!richText || richText.length === 0) {
    return null;
  }

  return (
    <span className={className}>
      {richText.map((item, index) => (
        <RichTextSegment key={index} item={item} />
      ))}
    </span>
  );
}

interface RichTextSegmentProps {
  item: RichTextItem;
}

function RichTextSegment({ item }: RichTextSegmentProps) {
  const { annotations, plain_text, href } = item;

  // 스타일 클래스 조합
  const textClasses = cn(
    annotations.bold && "font-bold",
    annotations.italic && "italic",
    annotations.strikethrough && "line-through",
    annotations.underline && "underline",
    annotations.code &&
      "px-1.5 py-0.5 rounded bg-muted font-mono text-sm text-primary",
    getColorClass(annotations.color)
  );

  let content: React.ReactNode = plain_text;

  // 링크 처리
  if (href) {
    content = (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-4 hover:text-primary/80"
      >
        {plain_text}
      </a>
    );
  }

  // 스타일이 있으면 span으로 감싸기
  if (textClasses) {
    return <span className={textClasses}>{content}</span>;
  }

  return <>{content}</>;
}

/**
 * Notion 컬러를 Tailwind 클래스로 변환
 */
function getColorClass(color: string): string | undefined {
  const colorMap: Record<string, string> = {
    gray: "text-gray-500",
    brown: "text-amber-700",
    orange: "text-orange-500",
    yellow: "text-yellow-600",
    green: "text-green-600",
    blue: "text-blue-600",
    purple: "text-purple-600",
    pink: "text-pink-500",
    red: "text-red-500",
    gray_background: "bg-gray-100 dark:bg-gray-800",
    brown_background: "bg-amber-100 dark:bg-amber-900/30",
    orange_background: "bg-orange-100 dark:bg-orange-900/30",
    yellow_background: "bg-yellow-100 dark:bg-yellow-900/30",
    green_background: "bg-green-100 dark:bg-green-900/30",
    blue_background: "bg-blue-100 dark:bg-blue-900/30",
    purple_background: "bg-purple-100 dark:bg-purple-900/30",
    pink_background: "bg-pink-100 dark:bg-pink-900/30",
    red_background: "bg-red-100 dark:bg-red-900/30",
  };

  return colorMap[color];
}
