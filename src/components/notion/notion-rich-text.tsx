import { ArrowRight, Globe, Github, Youtube, FileText, BookOpen, Code } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RichTextItem } from "@/types/notion-blocks";

interface NotionRichTextProps {
  richText: RichTextItem[];
  className?: string;
}

/**
 * URL 형태인지 확인
 */
function isUrlText(text: string): boolean {
  return /^https?:\/\//i.test(text.trim());
}

/**
 * 도메인별 아이콘 매핑
 */
function getIconForDomain(domain: string) {
  if (domain.includes("github.com")) return Github;
  if (domain.includes("youtube.com") || domain.includes("youtu.be")) return Youtube;
  if (domain.includes("notion.so") || domain.includes("notion.site")) return FileText;
  if (domain.includes("developer.mozilla.org") || domain.includes("mdn")) return BookOpen;
  if (domain.includes("stackoverflow.com")) return Code;
  if (domain.includes("docs.") || domain.includes("documentation")) return BookOpen;
  if (domain.includes("figma.com")) return FileText;
  return Globe;
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
    // URL이 텍스트로 그대로 표시된 경우 → 컴팩트 카드로 렌더링
    if (isUrlText(plain_text)) {
      return <InlineCompactLink url={href} />;
    }

    // 일반 텍스트 링크
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
 * 인라인 컴팩트 링크 카드
 * paragraph 내 URL 텍스트를 카드 형태로 표시
 * 주의: <p> 안에서 사용되므로 <div> 대신 <span>만 사용
 */
function InlineCompactLink({ url }: { url: string }) {
  let domain = "";
  try {
    domain = new URL(url).hostname.replace("www.", "");
  } catch {
    domain = url;
  }

  const Icon = getIconForDomain(domain);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card hover:bg-muted/50 hover:border-primary/50 transition-all group my-1 mx-0.5"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted group-hover:bg-primary/10 transition-colors">
        <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
      </span>
      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate max-w-[200px]">
        {domain}
      </span>
      <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
    </a>
  );
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
