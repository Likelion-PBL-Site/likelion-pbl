"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Monitor, Server, Palette, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePBLStore } from "@/store/pbl-store";
import { getMissionsByTrackSync } from "@/lib/mock-data";
import { trackLabels, difficultyLabels } from "@/types/pbl";
import type { TrackType } from "@/types/pbl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const trackIcons = {
  frontend: Monitor,
  backend: Server,
  design: Palette,
};

const trackColors = {
  frontend: "text-blue-500",
  backend: "text-green-500",
  design: "text-purple-500",
};

/**
 * PBL 사이드바 컴포넌트
 * 트랙 네비게이션과 미션 목록을 표시합니다.
 */
export function PBLSidebar() {
  const params = useParams();
  const { isSidebarCollapsed, toggleSidebar, missionProgress } = usePBLStore();

  const currentTrack = params.trackId as TrackType | undefined;
  const currentMissionId = params.missionId as string | undefined;

  const missions = currentTrack ? getMissionsByTrackSync(currentTrack) : [];

  const tracks: TrackType[] = ["frontend", "backend", "design"];

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-card transition-all duration-300",
        isSidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* 접기/펼치기 버튼 */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="absolute -right-3 top-4 z-10 h-6 w-6 rounded-full border bg-background shadow-sm"
      >
        {isSidebarCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {/* 트랙 목록 */}
      <div className="p-4">
        {!isSidebarCollapsed && (
          <h3 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
            트랙
          </h3>
        )}
        <nav className="space-y-1">
          {tracks.map((track) => {
            const Icon = trackIcons[track];
            const isActive = currentTrack === track;

            return (
              <Link
                key={track}
                href={`/${track}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", trackColors[track])} />
                {!isSidebarCollapsed && <span>{trackLabels[track]}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 미션 목록 (트랙 선택 시) */}
      {currentTrack && !isSidebarCollapsed && (
        <>
          <div className="border-t" />
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
              미션 목록
            </h3>
            <nav className="space-y-1">
              {missions.map((mission) => {
                const isActive = currentMissionId === mission.id;
                const progress = missionProgress[mission.id];
                const completedCount = progress?.completedRequirements.length || 0;

                return (
                  <Link
                    key={mission.id}
                    href={`/${currentTrack}/${mission.id}`}
                    className={cn(
                      "group flex flex-col gap-1 rounded-lg px-3 py-2 transition-colors",
                      isActive
                        ? "bg-primary/10"
                        : "hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className={cn(
                        "h-4 w-4 shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )} />
                      <span className={cn(
                        "text-sm truncate",
                        isActive ? "font-medium text-primary" : "text-foreground"
                      )}>
                        {mission.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pl-6">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {difficultyLabels[mission.difficulty]}
                      </Badge>
                      {completedCount > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {completedCount}개 완료
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </aside>
  );
}
