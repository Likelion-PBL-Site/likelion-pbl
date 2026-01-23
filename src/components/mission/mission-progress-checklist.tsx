"use client";

import { ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Requirement } from "@/types/pbl";

interface MissionProgressChecklistProps {
  requirements: Requirement[];
  completedRequirements: string[];
  progressPercent: number;
  /** @deprecated 체크는 이제 구현 지침 섹션에서 직접 처리 */
  onToggle?: (requirementId: string) => void;
}

/**
 * 미션 진행률 바 컴포넌트
 * - 체크리스트는 구현 지침(guidelines) 섹션의 heading_3에서 직접 처리
 * - 여기서는 진행률 바만 표시
 */
export function MissionProgressChecklist({
  requirements,
  completedRequirements,
  progressPercent,
}: MissionProgressChecklistProps) {
  const completedCount = completedRequirements.length;
  const totalCount = requirements.length;

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground flex items-center gap-1.5">
          <ListChecks className="h-4 w-4" />
          진행률
        </span>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {completedCount}/{totalCount}
          </Badge>
          <span className="font-medium">{progressPercent}%</span>
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        구현 지침 탭에서 각 단계를 클릭하여 완료 표시할 수 있습니다.
      </p>
    </div>
  );
}
