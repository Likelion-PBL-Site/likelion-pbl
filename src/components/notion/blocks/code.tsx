"use client";

import { useEffect, useState } from "react";
import { Copy, Check, FileCode } from "lucide-react";
import type { CodeBlock } from "@/types/notion-blocks";

interface CodeProps {
  block: CodeBlock;
}

export function Code({ block }: CodeProps) {
  const { rich_text, language, caption } = block.code;
  const code = rich_text.map((t) => t.plain_text).join("");
  const [copied, setCopied] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);

  // 코드 라인 분리
  const lines = code.split("\n");

  // 캡션을 파일명으로 사용
  const fileName = caption && caption.length > 0
    ? caption.map((t) => t.plain_text).join("")
    : null;

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
    <div className="my-6 rounded-xl overflow-hidden border border-border shadow-sm">
      {/* 파일명 헤더 (캡션이 있는 경우) */}
      {fileName && (
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/80 border-b border-border">
          <FileCode className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground">
            {fileName}
          </span>
        </div>
      )}

      {/* 언어 + 복사 버튼 */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
        <span className="text-xs text-gray-400 font-mono">
          {language || "plaintext"}
        </span>
        <button
          onClick={handleCopy}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs"
          title="코드 복사"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-400" />
              <span className="text-green-400">복사됨</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>복사</span>
            </>
          )}
        </button>
      </div>

      {/* 코드 영역 with 라인 넘버 */}
      <div className="flex bg-[#0d1117] text-sm overflow-x-auto">
        {/* 라인 넘버 */}
        <div className="select-none py-4 pr-4 pl-4 text-right text-gray-500 border-r border-[#30363d] font-mono flex-shrink-0">
          {lines.map((_, i) => (
            <div key={i} className="leading-6">
              {i + 1}
            </div>
          ))}
        </div>

        {/* 코드 */}
        <div className="flex-1 min-w-0">
          {highlightedHtml ? (
            <div
              className="py-4 pl-4 pr-6 [&>pre]:!bg-transparent [&>pre]:!m-0 [&>pre]:!p-0 [&_code]:leading-6"
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          ) : (
            <pre className="py-4 pl-4 pr-6 text-gray-300 font-mono">
              <code className="leading-6">{code}</code>
            </pre>
          )}
        </div>
      </div>
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
