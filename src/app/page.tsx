import Link from "next/link";
import { ArrowRight, Monitor, Server, Palette, CheckCircle2, Users, BookOpen, Trophy } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockTracks } from "@/lib/mock-data";

const trackIcons = {
  react: Monitor,
  springboot: Server,
  django: Server,
  design: Palette,
};

const trackColors = {
  react: "text-blue-500",
  springboot: "text-green-500",
  django: "text-yellow-500",
  design: "text-purple-500",
};

const features = [
  {
    icon: BookOpen,
    title: "프로젝트 기반 학습",
    description: "실제 프로젝트를 만들며 배우는 PBL 방식으로 실무 역량을 키웁니다.",
  },
  {
    icon: CheckCircle2,
    title: "단계별 미션",
    description: "체계적으로 구성된 미션을 따라가며 기초부터 심화까지 학습합니다.",
  },
  {
    icon: Users,
    title: "아기사자 맞춤 커리큘럼",
    description: "개발 경험이 없어도 쉽게 시작할 수 있도록 설계되었습니다.",
  },
  {
    icon: Trophy,
    title: "진행률 관리",
    description: "체크리스트와 진행률로 나의 학습 상태를 한눈에 파악합니다.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* 히어로 섹션 - PBL 강조 */}
      <Section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-16 md:py-24">
        {/* 배경 장식 */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

        <Container className="relative">
          <div className="flex flex-col items-center text-center">
            {/* PBL 대형 카드 */}
            <div className="mb-8 flex gap-3 sm:gap-4 md:gap-6">
              {/* P - Project */}
              <div className="group relative">
                <div className="flex h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-2xl shadow-primary/30 transition-transform hover:scale-105 hover:-rotate-3">
                  <span className="text-5xl sm:text-6xl md:text-7xl font-black text-white">P</span>
                </div>
                <div className="mt-3 text-center">
                  <span className="text-sm sm:text-base font-semibold text-primary">Project</span>
                </div>
              </div>

              {/* B - Based */}
              <div className="group relative mt-4 sm:mt-6 md:mt-8">
                <div className="flex h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/90 to-primary/70 shadow-2xl shadow-primary/25 transition-transform hover:scale-105 hover:rotate-3">
                  <span className="text-5xl sm:text-6xl md:text-7xl font-black text-white">B</span>
                </div>
                <div className="mt-3 text-center">
                  <span className="text-sm sm:text-base font-semibold text-primary/80">Based</span>
                </div>
              </div>

              {/* L - Learning */}
              <div className="group relative">
                <div className="flex h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/80 to-primary/60 shadow-2xl shadow-primary/20 transition-transform hover:scale-105 hover:-rotate-3">
                  <span className="text-5xl sm:text-6xl md:text-7xl font-black text-white">L</span>
                </div>
                <div className="mt-3 text-center">
                  <span className="text-sm sm:text-base font-semibold text-primary/60">Learning</span>
                </div>
              </div>
            </div>

            {/* 서브 타이틀 */}
            <h1 className="mb-4 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              <span className="text-primary">멋사대학</span>과 함께
              <br />
              IT 역량을 키워보세요
            </h1>
            <p className="mb-8 max-w-2xl text-base sm:text-lg text-muted-foreground">
              기획/디자인, 프론트엔드, 백엔드까지!
              <br className="hidden sm:block" />
              프로젝트를 직접 만들며 배우는 실전형 교육 플랫폼입니다.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/tracks">
                  학습 시작하기
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="https://likelion.net" target="_blank" rel="noopener noreferrer">
                  멋쟁이사자처럼 교육 더보기
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      {/* 트랙 소개 섹션 */}
      <Section className="py-20">
        <Container>
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-4">
              4개 트랙
            </Badge>
            <h2 className="mb-4 text-3xl font-bold">원하는 분야를 선택하세요</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              각 트랙은 단계별 미션으로 구성되어 있습니다.
              관심 있는 분야를 선택하고 프로젝트를 완성해보세요.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
            {mockTracks.map((track) => {
              const Icon = trackIcons[track.id as keyof typeof trackIcons];
              const colorClass = trackColors[track.id as keyof typeof trackColors];

              return (
                <Link key={track.id} href={`/${track.id}`}>
                  <Card className="group h-full transition-all hover:shadow-lg hover:border-primary/50">
                    <CardHeader>
                      <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-muted group-hover:bg-primary/10 transition-colors`}>
                        <Icon className={`h-7 w-7 ${colorClass}`} />
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {track.name}
                      </CardTitle>
                      <CardDescription>{track.description}</CardDescription>
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
        </Container>
      </Section>

      {/* 특징 섹션 */}
      <Section className="bg-muted/30 py-20">
        <Container>
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-4">
              왜 PBL인가요?
            </Badge>
            <h2 className="mb-4 text-3xl font-bold">프로젝트로 배우는 이유</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              이론만으로는 부족합니다. 직접 만들어보며 진짜 실력을 키우세요.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="border-none bg-background">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA 섹션 */}
      <Section className="py-20">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-primary p-8 md:p-12">
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            <div className="relative text-center">
              <h2 className="mb-4 text-2xl md:text-3xl font-bold text-primary-foreground">
                지금 바로 시작하세요
              </h2>
              <p className="mb-8 text-primary-foreground/80 max-w-xl mx-auto">
                개발 경험이 없어도 괜찮습니다.
                단계별 미션을 따라가다 보면 어느새 프로젝트가 완성되어 있을 거예요.
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
                asChild
              >
                <Link href="/tracks">
                  트랙 선택하러 가기
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
