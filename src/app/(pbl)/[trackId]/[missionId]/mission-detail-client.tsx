"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, ExternalLink } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { difficultyLabels, trackLabels } from "@/types/pbl";
import type { Mission, TrackType, Requirement } from "@/types/pbl";
import type { MissionSections } from "@/types/notion-blocks";
import { usePBLStore, calculateProgress } from "@/store/pbl-store";
import { NotionBlockRenderer } from "@/components/notion/notion-block-renderer";
import { MissionProgressChecklist } from "@/components/mission";

interface MissionDetailClientProps {
  mission: Mission;
  trackId: TrackType;
  /** Notion 섹션 블록 데이터 (있으면 블록 렌더러 사용) */
  sections?: MissionSections | null;
  /** Notion에서 추출한 요구사항 (있으면 이걸 사용) */
  notionRequirements?: Requirement[];
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
export function MissionDetailClient({
  mission,
  trackId,
  sections,
  notionRequirements,
}: MissionDetailClientProps) {
  const { missionProgress, toggleRequirement, visitMission } = usePBLStore();

  // 사용할 요구사항 목록 (Notion 우선, 없으면 mock)
  const requirements = notionRequirements || mission.requirements;

  // 방문 기록
  useEffect(() => {
    visitMission(mission.id);
  }, [mission.id, visitMission]);

  const progress = missionProgress[mission.id];
  const completedRequirements = progress?.completedRequirements || [];
  const progressPercent = calculateProgress(
    mission.id,
    requirements.length,
    missionProgress
  );

  // Notion 섹션 데이터가 있는지 확인
  const hasNotionData = sections && Object.values(sections).some((arr) => arr.length > 0);

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

          {/* 진행률 바 + 체크리스트 */}
          <MissionProgressChecklist
            requirements={requirements}
            completedRequirements={completedRequirements}
            progressPercent={progressPercent}
            onToggle={(reqId) => toggleRequirement(mission.id, reqId)}
          />
        </div>

        {/* 탭 콘텐츠 */}
        <Tabs defaultValue="intro" className="space-y-4 md:space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto h-auto gap-1 p-1 no-scrollbar">
            <TabsTrigger value="intro" className="text-xs md:text-sm px-2 md:px-3 shrink-0">미션 소개</TabsTrigger>
            <TabsTrigger value="objective" className="text-xs md:text-sm px-2 md:px-3 shrink-0">과제 목표</TabsTrigger>
            <TabsTrigger value="result" className="text-xs md:text-sm px-2 md:px-3 shrink-0">최종 결과물</TabsTrigger>
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
                {hasNotionData && sections?.introduction.length > 0 ? (
                  <NotionBlockRenderer blocks={sections.introduction} />
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {mission.introduction.split("\n\n").map((para, idx) => (
                      <p key={idx} className="mb-4 last:mb-0 whitespace-pre-line">
                        {para}
                      </p>
                    ))}
                  </div>
                )}
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
                {hasNotionData && sections?.objective.length > 0 ? (
                  <NotionBlockRenderer blocks={sections.objective} />
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {mission.objective.split("\n").map((line, idx) => (
                      <p key={idx} className="mb-2 last:mb-0">
                        {line}
                      </p>
                    ))}
                  </div>
                )}
                {/* 목표 수행 시간 */}
                {(hasNotionData && sections?.timeGoal.length > 0) || mission.timeGoal ? (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm font-medium mb-1">
                      <Clock className="h-4 w-4" />
                      목표 수행 시간
                    </div>
                    {hasNotionData && sections?.timeGoal.length > 0 ? (
                      <div className="text-sm text-muted-foreground">
                        <NotionBlockRenderer blocks={sections.timeGoal} />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {mission.timeGoal}
                      </p>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. 최종 결과물 (신규) */}
          <TabsContent value="result">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">최종 결과물</CardTitle>
              </CardHeader>
              <CardContent>
                {hasNotionData && sections?.result.length > 0 ? (
                  <NotionBlockRenderer blocks={sections.result} />
                ) : mission.result ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {mission.result.split("\n").map((line, idx) => (
                      <p key={idx} className="mb-2 last:mb-0">
                        {line}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    최종 결과물 정보가 아직 등록되지 않았습니다.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. 구현 지침 (기능 요구 사항) */}
          <TabsContent value="guidelines">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">구현 지침</CardTitle>
              </CardHeader>
              <CardContent>
                {hasNotionData && sections?.guidelines.length > 0 ? (
                  <NotionBlockRenderer blocks={sections.guidelines} />
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {mission.guidelines.split("\n").map((line, idx) => {
                      if (line.startsWith("### ")) {
                        return (
                          <h3 key={idx} className="text-lg font-semibold mt-6 mb-3 first:mt-0">
                            {line.replace("### ", "")}
                          </h3>
                        );
                      }
                      if (line.startsWith("```")) return null;
                      if (line.trim() === "") return null;
                      return (
                        <p key={idx} className="mb-2 last:mb-0 font-mono text-sm bg-muted p-2 rounded">
                          {line}
                        </p>
                      );
                    })}
                  </div>
                )}
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
                {hasNotionData && sections?.example.length > 0 ? (
                  <NotionBlockRenderer blocks={sections.example} />
                ) : mission.exampleImages && mission.exampleImages.length > 0 ? (
                  <div className="grid gap-4">
                    {mission.exampleImages.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`예시 이미지 ${idx + 1}`}
                        className="rounded-lg border"
                      />
                    ))}
                  </div>
                ) : !mission.exampleUrl ? (
                  <p className="text-muted-foreground">
                    이 미션에는 결과 예시가 아직 등록되지 않았습니다.
                  </p>
                ) : null}
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
                {hasNotionData && sections?.constraints.length > 0 ? (
                  <NotionBlockRenderer blocks={sections.constraints} />
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {mission.constraints.split("\n").map((line, idx) => (
                      <p key={idx} className="mb-2 last:mb-0 flex items-start gap-2">
                        <span className="text-destructive">•</span>
                        {line.replace(/^- /, "")}
                      </p>
                    ))}
                  </div>
                )}
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
                {hasNotionData && sections?.bonus.length > 0 ? (
                  <NotionBlockRenderer blocks={sections.bonus} />
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {mission.bonusTask.split("\n").map((line, idx) => (
                      <p key={idx} className="mb-2 last:mb-0 flex items-start gap-2">
                        <span className="text-primary">★</span>
                        {line.replace(/^- /, "")}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Container>
    </div>
  );
}
