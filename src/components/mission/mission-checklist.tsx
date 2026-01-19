"use client";

import { CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { Requirement } from "@/types/pbl";

interface MissionChecklistProps {
  requirements: Requirement[];
  completedRequirements: string[];
  onToggle: (requirementId: string) => void;
  /** 컴팩트 모드: 2열 그리드로 표시 (데스크톱용) */
  compact?: boolean;
}

/**
 * 미션 체크리스트 컴포넌트
 * 요구사항 목록을 체크박스로 표시
 */
export function MissionChecklist({
  requirements,
  completedRequirements,
  onToggle,
  compact = false,
}: MissionChecklistProps) {
  return (
    <div className={compact ? "grid gap-2 md:grid-cols-2" : "space-y-2"}>
      {requirements.map((req) => {
        const isCompleted = completedRequirements.includes(req.id);
        return (
          <div
            key={req.id}
            className={`flex gap-2 p-2.5 rounded-lg border transition-colors ${
              isCompleted
                ? "bg-primary/5 border-primary/20"
                : "bg-card hover:bg-muted/50 border-border"
            }`}
          >
            <Checkbox
              id={`checklist-${req.id}`}
              checked={isCompleted}
              onCheckedChange={() => onToggle(req.id)}
              className="mt-0.5 shrink-0"
            />
            <label
              htmlFor={`checklist-${req.id}`}
              className={`text-sm cursor-pointer flex-1 leading-tight ${
                isCompleted ? "line-through text-muted-foreground" : ""
              }`}
            >
              {req.title}
              {req.isRequired && (
                <Badge variant="outline" className="ml-1.5 text-[10px] py-0">
                  필수
                </Badge>
              )}
            </label>
            {isCompleted && (
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            )}
          </div>
        );
      })}
    </div>
  );
}
