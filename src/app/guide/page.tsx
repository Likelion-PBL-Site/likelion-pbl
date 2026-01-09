import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Lightbulb,
  Target,
  Clock,
  Monitor,
  Server,
  Palette,
  ExternalLink,
  ArrowRight
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "학습 가이드 | LIKELION UNIV",
  description: "멋쟁이사자처럼 PBL 학습 방법과 트랙별 로드맵을 안내합니다.",
};

const learningSteps = [
  {
    step: 1,
    title: "트랙 선택하기",
    description: "프론트엔드, 백엔드, 기획/디자인 중 관심 있는 분야를 선택하세요. 각 트랙은 독립적으로 진행할 수 있습니다.",
    icon: Target,
  },
  {
    step: 2,
    title: "미션 확인하기",
    description: "선택한 트랙의 미션 목록을 확인하세요. 미션은 난이도순으로 정렬되어 있어 순서대로 진행하는 것을 권장합니다.",
    icon: BookOpen,
  },
  {
    step: 3,
    title: "요구사항 체크하기",
    description: "각 미션의 기능 요구사항을 하나씩 구현하며 체크리스트를 완료해 나가세요. 진행률이 자동으로 저장됩니다.",
    icon: CheckCircle2,
  },
  {
    step: 4,
    title: "프로젝트 완성하기",
    description: "모든 요구사항을 완료하면 하나의 프로젝트가 완성됩니다. 보너스 과제에도 도전해보세요!",
    icon: Lightbulb,
  },
];

const trackRoadmaps = [
  {
    id: "frontend",
    name: "프론트엔드",
    icon: Monitor,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: "웹 프론트엔드 개발의 기초부터 심화까지",
    roadmap: [
      "React 컴포넌트 기초 이해",
      "상태 관리와 이벤트 처리",
      "API 연동과 데이터 페칭",
      "라우팅과 페이지 구성",
      "스타일링과 반응형 디자인",
    ],
  },
  {
    id: "backend",
    name: "백엔드",
    icon: Server,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    description: "서버 개발의 핵심 개념과 실무 패턴",
    roadmap: [
      "REST API 설계 원칙",
      "데이터베이스 모델링",
      "인증/인가 구현",
      "에러 핸들링과 로깅",
      "배포와 운영",
    ],
  },
  {
    id: "design",
    name: "기획/디자인",
    icon: Palette,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    description: "사용자 중심의 서비스 기획과 디자인",
    roadmap: [
      "사용자 조사와 페르소나",
      "정보 구조 설계",
      "와이어프레임 제작",
      "프로토타입 제작",
      "UI 디자인 시스템",
    ],
  },
];

const tips = [
  {
    title: "작은 단위로 나누어 진행하세요",
    description: "한 번에 모든 것을 구현하려 하지 말고, 요구사항을 하나씩 완료해 나가세요. 작은 성취가 쌓여 큰 결과물이 됩니다.",
  },
  {
    title: "막히면 구현 지침을 참고하세요",
    description: "각 미션에는 구현 지침 탭이 있습니다. 어떻게 시작해야 할지 모르겠다면 지침을 먼저 읽어보세요.",
  },
  {
    title: "완벽보다 완성을 목표로 하세요",
    description: "처음부터 완벽한 코드를 작성하려 하지 마세요. 일단 동작하는 코드를 만들고, 이후에 개선해 나가면 됩니다.",
  },
  {
    title: "보너스 과제는 선택입니다",
    description: "기본 요구사항을 모두 완료한 후에 도전하세요. 보너스 과제는 추가 학습을 위한 것입니다.",
  },
];

const resources = [
  {
    title: "MDN Web Docs",
    description: "웹 개발의 모든 것을 다루는 공식 문서",
    href: "https://developer.mozilla.org/ko/",
  },
  {
    title: "React 공식 문서",
    description: "React의 최신 공식 문서와 튜토리얼",
    href: "https://react.dev/",
  },
  {
    title: "Next.js 공식 문서",
    description: "Next.js 프레임워크 공식 가이드",
    href: "https://nextjs.org/docs",
  },
  {
    title: "Figma Learn",
    description: "디자인 툴 Figma 공식 학습 리소스",
    href: "https://help.figma.com/",
  },
];

export default function GuidePage() {
  return (
    <>
      {/* 페이지 헤더 */}
      <Section className="bg-gradient-to-b from-primary/5 to-background py-12 md:py-20">
        <Container>
          <div className="text-center">
            <Badge variant="outline" className="mb-4">
              Learning Guide
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">학습 가이드</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              멋쟁이사자처럼 PBL에서 효과적으로 학습하는 방법을 안내합니다.
              <br className="hidden md:block" />
              프로젝트 기반 학습으로 실무 역량을 키워보세요.
            </p>
          </div>
        </Container>
      </Section>

      {/* 시작하기 */}
      <Section className="py-12 md:py-16">
        <Container>
          <div className="mb-10">
            <Badge variant="outline" className="mb-3">Step by Step</Badge>
            <h2 className="text-2xl font-bold mb-2">PBL 학습 방법</h2>
            <p className="text-muted-foreground">
              4단계로 프로젝트를 완성해 나가세요.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {learningSteps.map((item) => (
              <Card key={item.step} className="relative">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                      {item.step}
                    </div>
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* 트랙별 로드맵 */}
      <Section className="bg-muted/30 py-12 md:py-16">
        <Container>
          <div className="mb-10">
            <Badge variant="outline" className="mb-3">Roadmap</Badge>
            <h2 className="text-2xl font-bold mb-2">트랙별 학습 로드맵</h2>
            <p className="text-muted-foreground">
              각 트랙에서 배우게 될 핵심 주제들입니다.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {trackRoadmaps.map((track) => (
              <Card key={track.id} className="h-full">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl ${track.bgColor} flex items-center justify-center mb-3`}>
                    <track.icon className={`h-6 w-6 ${track.color}`} />
                  </div>
                  <CardTitle>{track.name}</CardTitle>
                  <CardDescription>{track.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {track.roadmap.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link href={`/${track.id}`}>
                      {track.name} 시작하기
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* 미션 진행 팁 */}
      <Section className="py-12 md:py-16">
        <Container>
          <div className="mb-10">
            <Badge variant="outline" className="mb-3">Tips</Badge>
            <h2 className="text-2xl font-bold mb-2">미션 진행 팁</h2>
            <p className="text-muted-foreground">
              효과적인 학습을 위한 조언들입니다.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {tips.map((tip, idx) => (
              <Card key={idx} className="border-l-4 border-l-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    {tip.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{tip.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* 추천 리소스 */}
      <Section className="bg-muted/30 py-12 md:py-16">
        <Container>
          <div className="mb-10">
            <Badge variant="outline" className="mb-3">Resources</Badge>
            <h2 className="text-2xl font-bold mb-2">추천 리소스</h2>
            <p className="text-muted-foreground">
              추가 학습에 도움이 되는 외부 자료들입니다.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {resources.map((resource) => (
              <a
                key={resource.title}
                href={resource.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 group-hover:text-primary transition-colors">
                      {resource.title}
                      <ExternalLink className="h-3 w-3" />
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {resource.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </a>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section className="py-12 md:py-16">
        <Container>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">준비되셨나요?</span>
            </div>
            <h2 className="text-2xl font-bold mb-4">지금 바로 학습을 시작하세요</h2>
            <Button size="lg" asChild>
              <Link href="/tracks">
                트랙 선택하기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
