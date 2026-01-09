"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, ExternalLink, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { difficultyLabels, trackLabels } from "@/types/pbl";
import type { Mission, TrackType } from "@/types/pbl";
import { usePBLStore, calculateProgress } from "@/store/pbl-store";

interface MissionDetailClientProps {
  mission: Mission;
  trackId: TrackType;
}

const difficultyColors = {
  beginner: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  intermediate: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  advanced: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

/**
 * 미션 상세 클라이언트 컴포넌트
 * 체크리스트 인터랙션 및 진행률 관리를 담당
 */
export function MissionDetailClient({ mission, trackId }: MissionDetailClientProps) {
  const { missionProgress, toggleRequirement, visitMission } = usePBLStore();

  // 방문 기록
  useEffect(() => {
    visitMission(mission.id);
  }, [mission.id, visitMission]);

  const progress = missionProgress[mission.id];
  const completedRequirements = progress?.completedRequirements || [];
  const progressPercent = calculateProgress(
    mission.id,
    mission.requirements.length,
    missionProgress
  );

  return (
    <div className="py-6 md:py-8">
      <Container>
        {/* 뒤로가기 */}
        <Link
          href={`/${trackId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {trackLabels[trackId]} 트랙으로 돌아가기
        </Link>

        {/* 미션 헤더 */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="outline">{trackLabels[mission.track]}</Badge>
            <Badge className={difficultyColors[mission.difficulty]}>
              {difficultyLabels[mission.difficulty]}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {Math.floor(mission.estimatedTime / 60)}시간{" "}
                {mission.estimatedTime % 60 > 0 && `${mission.estimatedTime % 60}분`}
              </span>
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{mission.title}</h1>
          <p className="text-muted-foreground">{mission.description}</p>

          {/* 진행률 바 */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">진행률</span>
              <span className="font-medium">{progressPercent}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <Tabs defaultValue="intro" className="space-y-4 md:space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto h-auto gap-1 p-1 no-scrollbar">
            <TabsTrigger value="intro" className="text-xs md:text-sm px-2 md:px-3 shrink-0">미션 소개</TabsTrigger>
            <TabsTrigger value="objective" className="text-xs md:text-sm px-2 md:px-3 shrink-0">과제 목표</TabsTrigger>
            <TabsTrigger value="requirements" className="text-xs md:text-sm px-2 md:px-3 shrink-0">요구 사항</TabsTrigger>
            <TabsTrigger value="guidelines" className="text-xs md:text-sm px-2 md:px-3 shrink-0">구현 지침</TabsTrigger>
            <TabsTrigger value="example" className="text-xs md:text-sm px-2 md:px-3 shrink-0">결과 예시</TabsTrigger>
            <TabsTrigger value="constraints" className="text-xs md:text-sm px-2 md:px-3 shrink-0">제약 사항</TabsTrigger>
            <TabsTrigger value="bonus" className="text-xs md:text-sm px-2 md:px-3 shrink-0">보너스</TabsTrigger>
          </TabsList>

          {/* 1. 미션 소개 */}
          <TabsContent value="intro">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">미션 소개</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {mission.introduction.split("\n\n").map((para, idx) => (
                    <p key={idx} className="mb-4 last:mb-0 whitespace-pre-line">
                      {para}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. 과제 목표 */}
          <TabsContent value="objective">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">과제 목표</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {mission.objective.split("\n").map((line, idx) => (
                    <p key={idx} className="mb-2 last:mb-0">
                      {line}
                    </p>
                  ))}
                </div>
                {mission.timeGoal && (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm font-medium mb-1">
                      <Clock className="h-4 w-4" />
                      목표 수행 시간
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {mission.timeGoal}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. 기능 요구 사항 */}
          <TabsContent value="requirements">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">기능 요구 사항</CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                <div className="space-y-2 md:space-y-4">
                  {mission.requirements.map((req) => {
                    const isCompleted = completedRequirements.includes(req.id);

                    return (
                      <div
                        key={req.id}
                        className={`flex gap-2 md:gap-3 p-3 md:p-4 rounded-lg border transition-colors ${
                          isCompleted
                            ? "bg-primary/5 border-primary/20"
                            : "bg-card hover:bg-muted/50"
                        }`}
                      >
                        <Checkbox
                          id={req.id}
                          checked={isCompleted}
                          onCheckedChange={() =>
                            toggleRequirement(mission.id, req.id)
                          }
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={req.id}
                            className={`text-sm md:text-base font-medium cursor-pointer ${
                              isCompleted ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {req.title}
                            {req.isRequired && (
                              <Badge variant="outline" className="ml-1 md:ml-2 text-[10px] md:text-xs">
                                필수
                              </Badge>
                            )}
                          </label>
                          {req.description && (
                            <p className="text-xs md:text-sm text-muted-foreground mt-1">
                              {req.description}
                            </p>
                          )}
                        </div>
                        {isCompleted && (
                          <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. 구현 지침 */}
          <TabsContent value="guidelines">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">구현 지침</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {mission.guidelines.split("\n").map((line, idx) => {
                    // 헤딩 처리
                    if (line.startsWith("### ")) {
                      return (
                        <h3 key={idx} className="text-lg font-semibold mt-6 mb-3 first:mt-0">
                          {line.replace("### ", "")}
                        </h3>
                      );
                    }
                    // 코드 블록 시작/끝 무시
                    if (line.startsWith("```")) {
                      return null;
                    }
                    // 빈 줄 무시
                    if (line.trim() === "") {
                      return null;
                    }
                    // 일반 텍스트/코드
                    return (
                      <p key={idx} className="mb-2 last:mb-0 font-mono text-sm bg-muted p-2 rounded">
                        {line}
                      </p>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 5. 결과 예시 */}
          <TabsContent value="example">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">결과 예시</CardTitle>
              </CardHeader>
              <CardContent>
                {mission.exampleUrl && (
                  <div className="mb-6">
                    <Button variant="outline" asChild>
                      <a
                        href={mission.exampleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        예시 사이트 보기
                      </a>
                    </Button>
                  </div>
                )}
                {(!mission.exampleUrl && !mission.exampleImages?.length) && (
                  <p className="text-muted-foreground">
                    이 미션에는 결과 예시가 아직 등록되지 않았습니다.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 6. 제약 사항 */}
          <TabsContent value="constraints">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">제약 사항</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {mission.constraints.split("\n").map((line, idx) => (
                    <p key={idx} className="mb-2 last:mb-0 flex items-start gap-2">
                      <span className="text-destructive">•</span>
                      {line.replace(/^- /, "")}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 7. 보너스 과제 */}
          <TabsContent value="bonus">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">보너스 과제</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 mb-4">
                  <p className="text-sm text-muted-foreground">
                    보너스 과제는 필수가 아닙니다. 기본 요구사항을 모두 완료한 후 도전해보세요!
                  </p>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {mission.bonusTask.split("\n").map((line, idx) => (
                    <p key={idx} className="mb-2 last:mb-0 flex items-start gap-2">
                      <span className="text-primary">★</span>
                      {line.replace(/^- /, "")}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Container>
    </div>
  );
}
