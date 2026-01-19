import Link from "next/link";
import { Monitor, Server, Palette, ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockTracks } from "@/lib/mock-data";

const trackIcons = {
  react: Monitor,
  springboot: Server,
  django: Server,
  design: Palette,
};

const trackGradients = {
  react: "from-blue-500/10 to-blue-500/5",
  springboot: "from-green-500/10 to-green-500/5",
  django: "from-yellow-500/10 to-yellow-500/5",
  design: "from-purple-500/10 to-purple-500/5",
};

const trackBorderColors = {
  react: "hover:border-blue-500/50",
  springboot: "hover:border-green-500/50",
  django: "hover:border-yellow-500/50",
  design: "hover:border-purple-500/50",
};

const trackIconColors = {
  react: "text-blue-500",
  springboot: "text-green-500",
  django: "text-yellow-500",
  design: "text-purple-500",
};

export const metadata = {
  title: "트랙 선택 | 멋사 대학 PBL",
  description: "프론트엔드, 백엔드, 기획/디자인 트랙 중 학습할 분야를 선택하세요.",
};

export default function TracksPage() {
  return (
    <Section className="py-12 md:py-20">
      <Container>
        {/* 페이지 헤더 */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            트랙 선택
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            어떤 분야를 학습하시겠어요?
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            멋사 대학 PBL은 프론트엔드, 백엔드, 기획/디자인 세 가지 트랙을 제공합니다.
            관심 있는 분야를 선택하고 프로젝트 기반 학습을 시작하세요.
          </p>
        </div>

        {/* 트랙 카드 목록 */}
        <div className="grid gap-6 md:grid-cols-3">
          {mockTracks.map((track) => {
            const Icon = trackIcons[track.id as keyof typeof trackIcons];
            const gradient = trackGradients[track.id as keyof typeof trackGradients];
            const borderColor = trackBorderColors[track.id as keyof typeof trackBorderColors];
            const iconColor = trackIconColors[track.id as keyof typeof trackIconColors];

            return (
              <Link key={track.id} href={`/${track.id}`}>
                <Card className={`group h-full transition-all hover:shadow-lg ${borderColor} bg-gradient-to-b ${gradient}`}>
                  <CardHeader className="pb-4">
                    <div className={`w-12 h-12 rounded-xl bg-background flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
                      <Icon className={`h-6 w-6 ${iconColor}`} />
                    </div>
                    <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                      {track.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {track.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {track.missionCount}개 미션
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* 안내 문구 */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            각 트랙은 순차적으로 진행되는 미션으로 구성되어 있습니다.
            <br className="hidden md:block" />
            미션을 완료하며 실무 역량을 키워보세요.
          </p>
        </div>
      </Container>
    </Section>
  );
}
