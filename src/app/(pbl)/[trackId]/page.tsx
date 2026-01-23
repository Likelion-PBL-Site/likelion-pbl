import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CurriculumTable } from "@/components/curriculum/curriculum-table";
import { getMissionsByTrack } from "@/lib/mock-data";
import { trackLabels, difficultyLabels, type TrackType } from "@/types/pbl";
import { isValidTrackId, getTrackById } from "@/data/tracks";

interface TrackPageProps {
  params: Promise<{
    trackId: string;
  }>;
}

const difficultyColors = {
  beginner: "bg-green-500/10 text-green-600 dark:text-green-400",
  intermediate: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  advanced: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export default async function TrackPage({ params }: TrackPageProps) {
  const { trackId } = await params;

  // 유효한 트랙인지 확인
  if (!isValidTrackId(trackId)) {
    notFound();
  }

  const track = getTrackById(trackId);
  const missions = await getMissionsByTrack(trackId);

  if (!track) {
    notFound();
  }

  return (
    <div className="py-8">
      <Container>
        {/* 트랙 헤더 */}
        <div className="mb-8">
          <Badge variant="outline" className="mb-3">
            {trackLabels[trackId]}
          </Badge>
          <h1 className="text-3xl font-bold mb-2">{track.name} 트랙</h1>
          <p className="text-muted-foreground max-w-2xl">
            {track.description}
          </p>
        </div>

        {/* 커리큘럼 표 */}
        <CurriculumTable
          trackId={trackId as TrackType}
          missions={missions}
        />

        {/* 미션 목록 */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">미션 목록</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {missions.length > 0 ? (
              missions.map((mission, index) => (
                <Link key={mission.id} href={`/${trackId}/${mission.id}`}>
                  <Card className="group h-full transition-all hover:shadow-md hover:border-primary/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          미션 {index + 1}
                        </span>
                        <Badge
                          variant="secondary"
                          className={difficultyColors[mission.difficulty]}
                        >
                          {difficultyLabels[mission.difficulty]}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {mission.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {mission.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{Math.floor(mission.estimatedTime / 60)}시간 {mission.estimatedTime % 60}분</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                      {mission.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {mission.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              /* 미션이 없을 때 플레이스홀더 카드 */
              <Card className="opacity-60 border-dashed">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-muted-foreground">
                      준비 중
                    </Badge>
                  </div>
                  <CardTitle className="text-lg text-muted-foreground">
                    🚧 콘텐츠 제작 중
                  </CardTitle>
                  <CardDescription>
                    곧 새로운 미션이 추가됩니다!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    열심히 준비 중이니 조금만 기다려주세요.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
