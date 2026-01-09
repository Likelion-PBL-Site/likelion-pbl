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
    sm: { icon: 24, text: "text-base font-semibold" },
    md: { icon: 32, text: "text-lg font-bold" },
    lg: { icon: 40, text: "text-xl font-bold" },
  };

  const config = sizeConfig[size];

  const logoContent = (
    <div className={cn("flex items-center gap-2", className)}>
      {/* 사자 아이콘 (간단한 SVG) */}
      <div
        className="flex items-center justify-center rounded-lg bg-primary"
        style={{ width: config.icon, height: config.icon }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-primary-foreground"
          style={{ width: config.icon * 0.6, height: config.icon * 0.6 }}
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
            fill="currentColor"
          />
        </svg>
      </div>
      {!iconOnly && (
        <div className="flex flex-col">
          <span className={cn(config.text, "text-primary leading-tight")}>
            LIKELION UNIV.
          </span>
          <span className="text-[10px] font-medium text-muted-foreground leading-tight">
            PBL
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
