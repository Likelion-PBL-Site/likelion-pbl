import { AlertTriangle, Star, Lightbulb } from "lucide-react";
import { NotionRichText } from "../notion-rich-text";
import type { CalloutBlock } from "@/types/notion-blocks";

interface CalloutProps {
  block: CalloutBlock;
  children?: React.ReactNode;
}

export function Callout({ block, children }: CalloutProps) {
  const { icon, rich_text, color } = block.callout;

  // 아이콘 이모지 또는 기본 아이콘
  const iconEmoji: string | null = icon?.type === "emoji" ? (icon.emoji ?? null) : null;

  // 색상 기반 스타일 가져오기
  const styles = getCalloutStyles(color, iconEmoji);

  return (
    <div
      className={`flex gap-4 p-5 my-6 rounded-xl border border-l-4 shadow-sm ${styles.container}`}
    >
      {/* 아이콘 영역 */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${styles.iconBg}`}
      >
        {iconEmoji ? (
          <span className="text-xl">{iconEmoji}</span>
        ) : (
          styles.defaultIcon
        )}
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 min-w-0 space-y-1">
        {styles.title && (
          <p className={`font-medium ${styles.titleColor}`}>{styles.title}</p>
        )}
        <div className={styles.textColor}>
          <NotionRichText richText={rich_text} />
        </div>
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  );
}

interface CalloutStyles {
  container: string;
  iconBg: string;
  defaultIcon: React.ReactNode;
  title: string | null;
  titleColor: string;
  textColor: string;
}

function getCalloutStyles(color: string, emoji: string | null): CalloutStyles {
  // 이모지 기반 스타일 결정
  if (emoji === "💡" || emoji === "✨" || emoji === "📌") {
    return {
      container:
        "border-blue-200 dark:border-blue-800 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/30",
      iconBg: "bg-blue-100 dark:bg-blue-900/50",
      defaultIcon: <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      title: "Tip",
      titleColor: "text-blue-900 dark:text-blue-100",
      textColor: "text-blue-800 dark:text-blue-200",
    };
  }

  if (emoji === "⚠️" || emoji === "❗" || emoji === "🚨") {
    return {
      container:
        "border-yellow-200 dark:border-yellow-800 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/30",
      iconBg: "bg-yellow-100 dark:bg-yellow-900/50",
      defaultIcon: (
        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
      ),
      title: "주의",
      titleColor: "text-yellow-900 dark:text-yellow-100",
      textColor: "text-yellow-800 dark:text-yellow-200",
    };
  }

  if (emoji === "⭐" || emoji === "🌟" || emoji === "🎯") {
    return {
      container:
        "border-purple-200 dark:border-purple-800 border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/30",
      iconBg: "bg-purple-100 dark:bg-purple-900/50",
      defaultIcon: <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      title: "보너스 과제",
      titleColor: "text-purple-900 dark:text-purple-100",
      textColor: "text-purple-800 dark:text-purple-200",
    };
  }

  // 색상 기반 스타일 (기본)
  const colorStyles: Record<string, CalloutStyles> = {
    blue_background: {
      container:
        "border-blue-200 dark:border-blue-800 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/30",
      iconBg: "bg-blue-100 dark:bg-blue-900/50",
      defaultIcon: <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      title: null,
      titleColor: "text-blue-900 dark:text-blue-100",
      textColor: "text-blue-800 dark:text-blue-200",
    },
    yellow_background: {
      container:
        "border-yellow-200 dark:border-yellow-800 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/30",
      iconBg: "bg-yellow-100 dark:bg-yellow-900/50",
      defaultIcon: (
        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
      ),
      title: null,
      titleColor: "text-yellow-900 dark:text-yellow-100",
      textColor: "text-yellow-800 dark:text-yellow-200",
    },
    purple_background: {
      container:
        "border-purple-200 dark:border-purple-800 border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/30",
      iconBg: "bg-purple-100 dark:bg-purple-900/50",
      defaultIcon: <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      title: null,
      titleColor: "text-purple-900 dark:text-purple-100",
      textColor: "text-purple-800 dark:text-purple-200",
    },
    green_background: {
      container:
        "border-green-200 dark:border-green-800 border-l-green-500 bg-green-50/50 dark:bg-green-950/30",
      iconBg: "bg-green-100 dark:bg-green-900/50",
      defaultIcon: null,
      title: null,
      titleColor: "text-green-900 dark:text-green-100",
      textColor: "text-green-800 dark:text-green-200",
    },
    red_background: {
      container:
        "border-red-200 dark:border-red-800 border-l-red-500 bg-red-50/50 dark:bg-red-950/30",
      iconBg: "bg-red-100 dark:bg-red-900/50",
      defaultIcon: (
        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
      ),
      title: null,
      titleColor: "text-red-900 dark:text-red-100",
      textColor: "text-red-800 dark:text-red-200",
    },
    orange_background: {
      container:
        "border-orange-200 dark:border-orange-800 border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/30",
      iconBg: "bg-orange-100 dark:bg-orange-900/50",
      defaultIcon: null,
      title: null,
      titleColor: "text-orange-900 dark:text-orange-100",
      textColor: "text-orange-800 dark:text-orange-200",
    },
  };

  // 기본 스타일 (gray)
  const defaultStyle: CalloutStyles = {
    container:
      "border-gray-200 dark:border-gray-700 border-l-gray-400 bg-muted/50",
    iconBg: "bg-gray-100 dark:bg-gray-800",
    defaultIcon: null,
    title: null,
    titleColor: "text-foreground",
    textColor: "text-muted-foreground",
  };

  return colorStyles[color] || defaultStyle;
}
