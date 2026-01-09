import { PBLSidebar } from "@/components/layout/pbl-sidebar";
import { PBLMobileNav } from "@/components/layout/pbl-mobile-nav";

/**
 * PBL 트랙 레이아웃
 * 사이드바와 메인 콘텐츠 영역을 포함합니다.
 */
export default function PBLLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1">
      {/* 모바일 네비게이션 - 모바일에서만 표시 */}
      <PBLMobileNav />

      <div className="flex flex-1">
        {/* 사이드바 - 데스크탑에서만 표시 */}
        <div className="hidden md:block">
          <PBLSidebar />
        </div>
        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
