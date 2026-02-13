import Link from "next/link";
import { HelpCircle, MessageCircle, ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata = {
  title: "FAQ | LIKELION UNIV",
  description: "멋쟁이사자처럼 PBL에 대해 자주 묻는 질문과 답변입니다.",
};

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  description: string;
  items: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    title: "일반",
    description: "PBL과 멋쟁이사자처럼에 대한 기본적인 질문",
    items: [
      {
        question: "PBL이란 무엇인가요?",
        answer: "PBL(Project-Based Learning)은 프로젝트 기반 학습 방식입니다. 이론을 먼저 배우고 프로젝트를 만드는 기존 방식과 달리, 실제 프로젝트를 만들어 나가면서 필요한 지식과 기술을 습득합니다. 이를 통해 더 실무에 가까운 경험을 쌓을 수 있습니다.",
      },
      {
        question: "누가 참여할 수 있나요?",
        answer: "멋쟁이사자처럼 대학 소속 아기사자라면 누구나 참여할 수 있습니다. 개발 경험이 없어도 괜찮습니다. 초급 미션부터 차근차근 진행하면 됩니다.",
      },
      {
        question: "비용이 드나요?",
        answer: "멋쟁이사자처럼 PBL은 무료로 제공됩니다. 별도의 비용 없이 모든 학습 콘텐츠와 미션에 접근할 수 있습니다.",
      },
      {
        question: "오프라인 모임이 있나요?",
        answer: "PBL은 온라인으로 진행되는 자기주도 학습입니다. 다만, 소속 대학의 멋쟁이사자처럼 활동에 따라 오프라인 스터디나 세션이 있을 수 있습니다.",
      },
    ],
  },
  {
    title: "학습",
    description: "미션 진행과 학습 방법에 대한 질문",
    items: [
      {
        question: "미션은 어떻게 진행하나요?",
        answer: "각 미션 페이지에서 '미션 소개'부터 '보너스 과제'까지 7개 탭을 확인할 수 있습니다. 먼저 미션 소개와 과제 목표를 읽고, 기능 요구사항을 하나씩 구현해 나가세요. 완료한 항목은 체크리스트에서 체크하면 진행률이 자동으로 계산됩니다.",
      },
      {
        question: "진행률은 어디에 저장되나요?",
        answer: "진행률은 브라우저의 로컬 스토리지에 자동 저장됩니다. 같은 브라우저에서는 다시 접속해도 진행률이 유지됩니다. 다만, 브라우저 데이터를 삭제하거나 다른 기기에서 접속하면 진행률이 초기화될 수 있습니다.",
      },
      {
        question: "미션 순서대로 해야 하나요?",
        answer: "권장하지만 필수는 아닙니다. 미션은 난이도순으로 구성되어 있어 순서대로 진행하면 자연스럽게 학습 곡선을 따라갈 수 있습니다. 하지만 이미 기초가 있다면 중급 미션부터 시작해도 됩니다.",
      },
      {
        question: "막히면 어떻게 하나요?",
        answer: "먼저 '구현 지침' 탭을 확인해보세요. 힌트와 접근 방법이 제공됩니다. 그래도 어렵다면 구글 검색이나 공식 문서를 참고하세요. 학습 가이드 페이지에 추천 리소스도 있습니다.",
      },
      {
        question: "보너스 과제도 해야 하나요?",
        answer: "보너스 과제는 선택 사항입니다. 기본 요구사항을 모두 완료한 후 추가 도전을 원할 때 시도해보세요. 더 깊은 학습과 포트폴리오 강화에 도움이 됩니다.",
      },
    ],
  },
  {
    title: "트랙",
    description: "트랙 선택과 진행에 대한 질문",
    items: [
      {
        question: "어떤 트랙을 선택해야 하나요?",
        answer: "관심 있는 분야를 선택하세요. 웹사이트를 직접 만들고 싶다면 프론트엔드, 서버와 데이터베이스에 관심이 있다면 백엔드, 서비스 기획과 디자인에 관심이 있다면 기획/디자인 트랙을 추천합니다.",
      },
      {
        question: "트랙을 바꿀 수 있나요?",
        answer: "네, 언제든지 다른 트랙의 미션을 진행할 수 있습니다. 각 트랙은 독립적으로 구성되어 있어 원하는 트랙을 자유롭게 선택하고 진행할 수 있습니다.",
      },
      {
        question: "여러 트랙을 동시에 진행해도 되나요?",
        answer: "가능합니다. 다만, 한 트랙을 어느 정도 완료한 후 다른 트랙으로 넘어가는 것을 권장합니다. 집중해서 학습해야 더 효과적으로 역량을 키울 수 있습니다.",
      },
      {
        question: "트랙을 모두 완료하면 어떻게 되나요?",
        answer: "축하합니다! 각 트랙을 완료하면 해당 분야의 기초 역량을 갖추게 됩니다. 완성한 프로젝트들은 포트폴리오로 활용할 수 있습니다. 더 깊은 학습을 원한다면 추천 리소스를 참고하세요.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <>
      {/* 페이지 헤더 */}
      <Section className="bg-gradient-to-b from-primary/5 to-background py-12 md:py-20">
        <Container>
          <div className="text-center">
            <Badge variant="outline" className="mb-4">
              FAQ
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">자주 묻는 질문</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              멋쟁이사자처럼 PBL에 대해 자주 묻는 질문들을 모았습니다.
              <br className="hidden md:block" />
              찾는 답변이 없다면 운영팀에 문의해주세요.
            </p>
          </div>
        </Container>
      </Section>

      {/* FAQ 카테고리별 */}
      <Section className="py-12 md:py-16">
        <Container>
          <div className="max-w-3xl mx-auto space-y-12">
            {faqCategories.map((category, categoryIdx) => (
              <div key={category.title}>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold">{category.title}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  {category.items.map((item, itemIdx) => (
                    <AccordionItem
                      key={itemIdx}
                      value={`${categoryIdx}-${itemIdx}`}
                      className="border rounded-lg mb-4 overflow-hidden data-[state=open]:bg-muted/50"
                    >
                      <AccordionTrigger className="text-left hover:no-underline px-4">
                        <span className="font-medium">{item.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground px-4 pb-4">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* 추가 질문 CTA */}
      <Section className="bg-muted/30 py-12 md:py-16">
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <MessageCircle className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">더 궁금한 점이 있으신가요?</span>
            </div>
            <h2 className="text-2xl font-bold mb-4">학습 가이드를 확인해보세요</h2>
            <p className="text-muted-foreground mb-6">
              PBL 학습 방법, 트랙별 로드맵, 미션 진행 팁 등
              <br className="hidden md:block" />
              더 자세한 안내를 확인할 수 있습니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild>
                <Link href="/guide">
                  학습 가이드 보기
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/tracks">
                  트랙 선택하기
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
