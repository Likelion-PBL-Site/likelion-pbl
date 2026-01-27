import { ArrowRight, Globe, Github, Youtube, FileText, BookOpen, Code } from "lucide-react";
import type { BookmarkBlock } from "@/types/notion-blocks";
import { NotionRichText } from "../notion-rich-text";

interface BookmarkProps {
  block: BookmarkBlock;
}

// 도메인별 아이콘 매핑
function getIconForDomain(domain: string) {
  if (domain.includes("github.com")) return Github;
  if (domain.includes("youtube.com") || domain.includes("youtu.be")) return Youtube;
  if (domain.includes("notion.so") || domain.includes("notion.site")) return FileText;
  if (domain.includes("developer.mozilla.org") || domain.includes("mdn")) return BookOpen;
  if (domain.includes("stackoverflow.com")) return Code;
  if (domain.includes("docs.") || domain.includes("documentation")) return BookOpen;
  return Globe;
}

export function Bookmark({ block }: BookmarkProps) {
  const { url, caption } = block.bookmark;

  // URL에서 도메인 추출
  let domain = "";
  try {
    domain = new URL(url).hostname.replace("www.", "");
  } catch {
    domain = url;
  }

  const Icon = getIconForDomain(domain);

  // 캡션이 있으면 제목으로, 없으면 도메인을 제목으로
  const hasCaption = caption && caption.length > 0;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-card hover:bg-muted/50 hover:border-primary/50 transition-all group my-2"
    >
      {/* 아이콘 영역 */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>

      {/* 텍스트 영역 */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
          {hasCaption ? (
            <NotionRichText richText={caption} />
          ) : (
            domain
          )}
        </p>
        {hasCaption && (
          <p className="text-sm text-muted-foreground truncate">
            {domain}
          </p>
        )}
      </div>

      {/* 화살표 */}
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
    </a>
  );
}
