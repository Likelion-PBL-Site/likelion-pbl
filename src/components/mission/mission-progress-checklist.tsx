"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useBreakpoint } from "@/hooks/use-media-query";
import { MissionChecklist } from "./mission-checklist";
import type { Requirement } from "@/types/pbl";

interface MissionProgressChecklistProps {
  requirements: Requirement[];
  completedRequirements: string[];
  progressPercent: number;
  onToggle: (requirementId: string) => void;
}

/**
 * 미션 진행률 + 체크리스트 통합 컴포넌트
 * - 데스크톱: Collapsible 아코디언
 * - 모바일: Bottom Sheet
 */
export function MissionProgressChecklist({
  requirements,
  completedRequirements,
  progressPercent,
  onToggle,
}: MissionProgressChecklistProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isMd } = useBreakpoint();

  const completedCount = completedRequirements.length;
  const totalCount = requirements.length;

  // 데스크톱: Collapsible 아코디언
  if (isMd) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4">
        {/* 진행률 바 + 트리거 */}
        <div className="space-y-2">
          <CollapsibleTrigger asChild>
            <button className="w-full text-left group">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <ListChecks className="h-4 w-4" />
                  진행률
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {completedCount}/{totalCount}
                  </Badge>
                  <span className="font-medium">{progressPercent}%</span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground transition-transform" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
                  )}
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </button>
          </CollapsibleTrigger>

          {/* 체크리스트 (펼쳐짐) */}
          <CollapsibleContent className="pt-3">
            <div className="p-4 bg-muted/30 rounded-lg border">
              <MissionChecklist
                requirements={requirements}
                completedRequirements={completedRequirements}
                onToggle={onToggle}
                compact
              />
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  }

  // 모바일: Bottom Sheet
  return (
    <div className="mt-4">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button className="w-full text-left">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <ListChecks className="h-4 w-4" />
                진행률
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {completedCount}/{totalCount}
                </Badge>
                <span className="font-medium">{progressPercent}%</span>
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </button>
        </SheetTrigger>

        <SheetContent side="bottom" className="max-h-[70vh]">
          <SheetHeader className="pb-2">
            <SheetTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ListChecks className="h-5 w-5" />
                체크리스트
              </span>
              <Badge variant="secondary">
                {completedCount}/{totalCount} 완료
              </Badge>
            </SheetTitle>
            <SheetDescription className="sr-only">
              미션 요구사항 체크리스트입니다. 완료한 항목을 체크하세요.
            </SheetDescription>
          </SheetHeader>

          {/* 진행률 바 (Sheet 내부) */}
          <div className="px-4 pb-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* 체크리스트 */}
          <div className="px-4 pb-4 overflow-y-auto">
            <MissionChecklist
              requirements={requirements}
              completedRequirements={completedRequirements}
              onToggle={onToggle}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
