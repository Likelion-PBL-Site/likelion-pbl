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
    <div className="my-4 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 w-full text-left px-4 py-3",
          "hover:bg-muted/50 transition-colors",
          isOpen && "border-b border-border bg-muted/30"
        )}
      >
        <div className="flex-shrink-0 w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
          <ChevronRight
            className={cn(
              "h-4 w-4 text-primary transition-transform duration-200",
              isOpen && "rotate-90"
            )}
          />
        </div>
        <span className="font-medium leading-7">
          <NotionRichText richText={block.toggle.rich_text} />
        </span>
      </button>
      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          {children && (
            <div className="px-4 py-4 pl-[52px]">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
