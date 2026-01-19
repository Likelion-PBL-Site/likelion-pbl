"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Monitor, Server, Palette, Menu, ChevronRight, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePBLStore } from "@/store/pbl-store";
import { getMissionsByTrackSync } from "@/lib/mock-data";
import { trackLabels, difficultyLabels } from "@/types/pbl";
import type { TrackType } from "@/types/pbl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const trackIcons: Record<TrackType, typeof Monitor> = {
  react: Monitor,
  springboot: Server,
  django: Server,
  design: Palette,
};

const trackColors: Record<TrackType, string> = {
  react: "text-blue-500",
  springboot: "text-green-500",
  django: "text-yellow-500",
  design: "text-purple-500",
};

const trackBgColors: Record<TrackType, string> = {
  react: "bg-blue-500/10",
  springboot: "bg-green-500/10",
  django: "bg-yellow-500/10",
  design: "bg-purple-500/10",
};

/**
 * PBL 모바일 네비게이션 컴포넌트
 * 모바일에서 사이드바 대신 표시되는 네비게이션
 */
export function PBLMobileNav() {
  const params = useParams();
  const { missionProgress } = usePBLStore();

  const currentTrack = params.trackId as TrackType | undefined;
  const currentMissionId = params.missionId as string | undefined;

  const missions = currentTrack ? getMissionsByTrackSync(currentTrack) : [];
  const currentMission = currentMissionId
    ? missions.find((m) => m.id === currentMissionId)
    : null;

  const tracks: TrackType[] = ["react", "springboot", "django", "design"];

  // 현재 트랙의 아이콘
  const CurrentTrackIcon = currentTrack ? trackIcons[currentTrack] : null;

  return (
    <div className="sticky top-[57px] z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex items-center justify-between px-4 py-2">
        {/* 현재 위치 표시 */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {currentTrack && CurrentTrackIcon && (
            <>
              <div className={cn("shrink-0 flex h-7 w-7 items-center justify-center rounded-md", trackBgColors[currentTrack])}>
                <CurrentTrackIcon className={cn("h-4 w-4", trackColors[currentTrack])} />
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-sm font-medium truncate">
                  {trackLabels[currentTrack]}
                </span>
                {currentMission && (
                  <>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground truncate">
                      {currentMission.title}
                    </span>
                  </>
                )}
              </div>
            </>
          )}
          {!currentTrack && (
            <span className="text-sm font-medium">트랙을 선택하세요</span>
          )}
        </div>

        {/* 메뉴 버튼 */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 ml-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">네비게이션 열기</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>미션 네비게이션</SheetTitle>
            </SheetHeader>

            <div className="flex flex-col h-[calc(100%-57px)]">
              {/* 트랙 목록 */}
              <div className="p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                  트랙
                </h3>
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
                        <span>{trackLabels[track]}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* 미션 목록 (트랙 선택 시) */}
              {currentTrack && (
                <>
                  <div className="border-t" />
                  <div className="flex-1 overflow-y-auto p-4">
                    <h3 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                      {trackLabels[currentTrack]} 미션
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
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
