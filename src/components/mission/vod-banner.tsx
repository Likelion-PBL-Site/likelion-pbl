"use client";

import { useState } from "react";
import { Video, ChevronDown } from "lucide-react";
import type { NotionBlock } from "@/types/notion-blocks";
import { NotionBlockRenderer } from "@/components/notion";

interface VodBannerProps {
  blocks: NotionBlock[];
}

/**
 * VOD 배너 컴포넌트 (인라인 드롭다운)
 * 미션 페이지 헤더 영역에 인라인으로 표시
 * 클릭 시 상세 정보 드롭다운
 */
export function VodBanner({ blocks }: VodBannerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (blocks.length === 0) return null;

  return (
    <div className="relative ml-auto">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-md text-sm transition-colors"
      >
        <Video className="h-4 w-4" />
        <span className="font-medium">참고 VOD</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 p-4 bg-blue-50 dark:bg-blue-950/90 border border-blue-200/50 dark:border-blue-800/50 rounded-lg text-sm shadow-lg min-w-[300px] max-w-[400px]">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-200/50 dark:border-blue-800/50">
            <Video className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-blue-900 dark:text-blue-100">
              참고 VOD
            </span>
          </div>
          <div className="text-blue-800/80 dark:text-blue-200/80 [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-blue-700 dark:hover:[&_a]:text-blue-300 [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1">
            <NotionBlockRenderer blocks={blocks} />
          </div>
        </div>
      )}
    </div>
  );
}
