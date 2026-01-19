"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { NotionRichText } from "../notion-rich-text";
import { cn } from "@/lib/utils";
import type { ToggleBlock } from "@/types/notion-blocks";

interface ToggleProps {
  block: ToggleBlock;
  children?: React.ReactNode;
}

export function Toggle({ block, children }: ToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="my-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 w-full text-left hover:bg-muted/50 rounded px-1 py-0.5 -ml-1"
      >
        <ChevronRight
          className={cn(
            "h-4 w-4 flex-shrink-0 transition-transform",
            isOpen && "rotate-90"
          )}
        />
        <span className="leading-7">
          <NotionRichText richText={block.toggle.rich_text} />
        </span>
      </button>
      {isOpen && children && (
        <div className="ml-5 mt-1 pl-2 border-l-2 border-muted">
          {children}
        </div>
      )}
    </div>
  );
}
