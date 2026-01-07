import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMissionsByTrack, mockTracks } from "@/lib/mock-data";
import { trackLabels, difficultyLabels } from "@/types/pbl";
import type { TrackType } from "@/types/pbl";

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
  const validTracks: TrackType[] = ["frontend", "backend", "design"];
  if (!validTracks.includes(trackId as TrackType)) {
    notFound();
  }

  const track = mockTracks.find((t) => t.id === trackId);
  const missions = getMissionsByTrack(trackId);

  if (!track) {
    notFound();
  }

  return (
    <div className="py-8">
      <Container>
        {/* 트랙 헤더 */}
        <div className="mb-8">
          <Badge variant="outline" className="mb-3">
            {trackLabels[trackId as TrackType]}
          </Badge>
          <h1 className="text-3xl font-bold mb-2">{track.name} 트랙</h1>
          <p className="text-muted-foreground max-w-2xl">
            {track.description}
          </p>
        </div>

        {/* 미션 목록 */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">미션 목록</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {missions.map((mission, index) => (
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
            ))}
          </div>
        </div>

        {/* 미션이 없을 때 */}
        {missions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              아직 등록된 미션이 없습니다.
            </p>
          </div>
        )}
      </Container>
    </div>
  );
}
