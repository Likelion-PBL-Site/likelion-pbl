import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** 로고 크기 */
  size?: "sm" | "md" | "lg";
  /** 링크 비활성화 */
  asLink?: boolean;
}

/**
 * 멋쟁이사자처럼 로고 컴포넌트
 */
export function Logo({
  className,
  size = "md",
  asLink = true,
}: LogoProps) {
  const sizeConfig = {
    sm: { width: 120, height: 30 },
    md: { width: 150, height: 38 },
    lg: { width: 180, height: 45 },
  };

  const config = sizeConfig[size];

  const logoContent = (
    <div className={cn("flex items-center", className)}>
      <Image
        src="/likelion_logo.svg"
        alt="LIKELION"
        width={config.width}
        height={config.height}
        priority
      />
    </div>
  );

  if (!asLink) {
    return logoContent;
  }

  return (
    <Link
      href="/"
      className="flex items-center transition-opacity hover:opacity-80"
    >
      {logoContent}
    </Link>
  );
}
