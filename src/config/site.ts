import type { SiteConfig, NavConfig, FooterLinkGroup } from "@/types";

/**
 * 멋쟁이사자처럼 PBL 사이트 설정
 */
export const siteConfig: SiteConfig = {
  name: "LIKELION UNIV",
  description: "아기사자를 위한 IT 교육 프로젝트 기반 학습 플랫폼",
  url: "https://pbl.likelion.org",
  ogImage: "/likelion.jpg",
  links: {
    github: "https://github.com/likelion",
    twitter: "https://twitter.com/liaboratory",
  },
};

/**
 * 네비게이션 설정
 */
export const navConfig: NavConfig = {
  mainNav: [
    {
      title: "홈",
      href: "/",
    },
    {
      title: "트랙",
      href: "/tracks",
    },
    {
      title: "학습 가이드",
      href: "/guide",
    },
    {
      title: "FAQ",
      href: "/faq",
    },
  ],
};

/**
 * 트랙 정보
 */
export const trackConfig = {
  react: {
    id: "react",
    name: "프론트엔드 (React)",
    description: "React, Next.js를 활용한 웹 프론트엔드 개발",
    icon: "Monitor",
    color: "var(--track-frontend)",
  },
  springboot: {
    id: "springboot",
    name: "백엔드 (Spring Boot)",
    description: "Java와 Spring Boot를 활용한 서버 개발",
    icon: "Server",
    color: "var(--track-backend)",
  },
  django: {
    id: "django",
    name: "백엔드 (Django)",
    description: "Python과 Django를 활용한 서버 개발",
    icon: "Server",
    color: "var(--track-backend)",
  },
  design: {
    id: "design",
    name: "기획/디자인",
    description: "서비스 기획과 UI/UX 디자인",
    icon: "Palette",
    color: "var(--track-design)",
  },
} as const;

export type TrackId = keyof typeof trackConfig;

/**
 * 푸터 링크 그룹 설정
 */
export const footerLinks: FooterLinkGroup[] = [
  {
    title: "교육",
    links: [
      { title: "프론트엔드 (React)", href: "/react" },
      { title: "백엔드 (Spring Boot)", href: "/springboot" },
      { title: "백엔드 (Django)", href: "/django" },
      { title: "기획/디자인", href: "/design" },
    ],
  },
  {
    title: "리소스",
    links: [
      { title: "학습 가이드", href: "/guide" },
      { title: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "멋쟁이사자처럼",
    links: [
      { title: "공식 사이트", href: "https://likelion.net", external: true }
    ],
  },
];
