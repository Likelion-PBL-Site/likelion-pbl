"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CodeBlock } from "@/types/notion-blocks";

interface CodeProps {
  block: CodeBlock;
}

export function Code({ block }: CodeProps) {
  const { rich_text, language, caption } = block.code;
  const code = rich_text.map((t) => t.plain_text).join("");
  const [copied, setCopied] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);

  // Shiki로 코드 하이라이팅 (클라이언트 사이드)
  useEffect(() => {
    async function highlight() {
      try {
        const { codeToHtml } = await import("shiki");
        const html = await codeToHtml(code, {
          lang: mapLanguage(language),
          theme: "github-dark",
        });
        setHighlightedHtml(html);
      } catch {
        // 하이라이팅 실패 시 일반 코드 표시
        setHighlightedHtml(null);
      }
    }
    highlight();
  }, [code, language]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-border">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
        <span className="text-xs text-muted-foreground font-mono">
          {language || "plaintext"}
        </span>
        <button
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="코드 복사"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* 코드 영역 */}
      <div className="overflow-x-auto">
        {highlightedHtml ? (
          <div
            className={cn(
              "p-4 text-sm [&>pre]:!bg-transparent [&>pre]:!m-0 [&>pre]:!p-0",
              "bg-[#0d1117]"
            )}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        ) : (
          <pre className="p-4 text-sm bg-[#0d1117] text-gray-300 overflow-x-auto">
            <code>{code}</code>
          </pre>
        )}
      </div>

      {/* 캡션 */}
      {caption && caption.length > 0 && (
        <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/30 border-t border-border">
          {caption.map((t) => t.plain_text).join("")}
        </div>
      )}
    </div>
  );
}

/**
 * Notion 언어 이름을 Shiki 언어 ID로 매핑
 */
function mapLanguage(lang: string): string {
  const languageMap: Record<string, string> = {
    "plain text": "text",
    javascript: "javascript",
    typescript: "typescript",
    python: "python",
    java: "java",
    kotlin: "kotlin",
    swift: "swift",
    go: "go",
    rust: "rust",
    c: "c",
    "c++": "cpp",
    "c#": "csharp",
    php: "php",
    ruby: "ruby",
    sql: "sql",
    html: "html",
    css: "css",
    json: "json",
    yaml: "yaml",
    markdown: "markdown",
    bash: "bash",
    shell: "shell",
    powershell: "powershell",
    dockerfile: "dockerfile",
    graphql: "graphql",
  };

  return languageMap[lang.toLowerCase()] || "text";
}
