import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** 로고 크기 */
  size?: "sm" | "md" | "lg";
  /** 링크 비활성화 */
  asLink?: boolean;
  /** 아이콘만 표시 */
  iconOnly?: boolean;
}

/**
 * 멋쟁이사자처럼 로고 컴포넌트
 */
export function Logo({
  className,
  size = "md",
  asLink = true,
  iconOnly = false,
}: LogoProps) {
  const sizeConfig = {
    sm: { emoji: "text-xl", text: "text-base font-semibold" },
    md: { emoji: "text-2xl", text: "text-lg font-bold" },
    lg: { emoji: "text-3xl", text: "text-xl font-bold" },
  };

  const config = sizeConfig[size];

  const logoContent = (
    <div className={cn("flex items-center gap-2", className)}>
      {/* 사자 이모지 */}
      <span className={config.emoji} role="img" aria-label="lion">
        🦁
      </span>
      {!iconOnly && (
        <div className="flex flex-col">
          <span className={cn(config.text, "text-primary leading-tight")}>
            LIKELION UNIV.
          </span>
        </div>
      )}
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
