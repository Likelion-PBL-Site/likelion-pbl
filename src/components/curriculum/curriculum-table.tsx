"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MissionSummary, TrackType } from "@/types/pbl";
import { trackStageColors } from "@/data/tracks";

interface CurriculumTableProps {
  trackId: TrackType;
  missions: MissionSummary[];
  /** 기본 펼침 상태 (기본값: true) */
  defaultOpen?: boolean;
}

/**
 * 접이식 커리큘럼 표 컴포넌트
 * 트랙별 미션 목록을 표 형태로 보여줌
 */
export function CurriculumTable({
  trackId,
  missions,
  defaultOpen = true,
}: CurriculumTableProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // 주차 계산 (order 기준, 없으면 index + 1)
  const getWeek = (mission: MissionSummary, index: number) => {
    return mission.order || index + 1;
  };

  if (missions.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-8">
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted rounded-lg border transition-colors">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="font-semibold">커리큘럼</span>
            <Badge variant="secondary" className="ml-2">
              {missions.length}개 미션
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{isOpen ? "접기" : "펼치기"}</span>
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[80px] text-center">주차</TableHead>
                <TableHead>미션</TableHead>
                <TableHead className="hidden md:table-cell">핵심 키워드</TableHead>
                <TableHead className="w-[120px] text-center">단계</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {missions.map((mission, index) => (
                <TableRow
                  key={mission.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="text-center font-medium">
                    {getWeek(mission, index)}주
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/${trackId}/${mission.id}`}
                      className="hover:text-primary hover:underline transition-colors"
                    >
                      {mission.title}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {mission.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {mission.stage && (
                      <Badge
                        variant="outline"
                        className={trackStageColors[trackId]}
                      >
                        {mission.stage}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
