"use client";

import { useState, useEffect, useCallback } from "react";
import { ImageOff, Info, ZoomIn, X } from "lucide-react";
import type { ImageBlock } from "@/types/notion-blocks";

interface ImageProps {
  block: ImageBlock;
}

export function NotionImage({ block }: ImageProps) {
  const { image } = block;
  const [error, setError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // 원본 URL 가져오기
  const originalUrl =
    image.type === "file" ? image.file?.url : image.external?.url;

  if (!originalUrl) {
    return <ImagePlaceholder message="이미지 URL을 찾을 수 없습니다" />;
  }

  // 프록시 URL 생성 (Notion S3 이미지만)
  const isNotionS3 = originalUrl.includes("s3.us-west-2.amazonaws.com");

  // S3 이미지 + file 타입일 때만 blockId 전달 (URL 만료 시 갱신용)
  const shouldIncludeBlockId = isNotionS3 && image.type === "file";
  const proxyParams = new URLSearchParams({ url: originalUrl });
  if (shouldIncludeBlockId) {
    proxyParams.set("blockId", block.id);
  }

  const imageUrl = isNotionS3
    ? `/api/notion/image?${proxyParams.toString()}`
    : originalUrl;

  // 캡션
  const caption = image.caption?.map((t) => t.plain_text).join("") || "";

  if (error) {
    return <ImagePlaceholder message="이미지를 불러올 수 없습니다" />;
  }

  return (
    <>
      <figure className="my-6 max-w-md mx-auto">
        <div className="rounded-xl overflow-hidden border border-border bg-card shadow-sm">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="relative w-full group cursor-zoom-in"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={caption || "Notion 이미지"}
              className="w-full h-auto transition-transform duration-200 group-hover:scale-[1.02]"
              loading="lazy"
              onError={() => setError(true)}
            />
            {/* Zoom 오버레이 */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-800/90 rounded-full p-2 shadow-lg">
                <ZoomIn className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              </div>
            </div>
          </button>
          {caption && (
            <figcaption className="px-4 py-3 text-sm text-muted-foreground bg-muted/30 border-t border-border flex items-center gap-2">
              <Info className="w-4 h-4 flex-shrink-0 text-muted-foreground/70" />
              <span>{caption}</span>
            </figcaption>
          )}
        </div>
      </figure>

      {/* 라이트박스 모달 */}
      {isLightboxOpen && (
        <Lightbox
          imageUrl={imageUrl}
          caption={caption}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}
    </>
  );
}

interface LightboxProps {
  imageUrl: string;
  caption: string;
  onClose: () => void;
}

function Lightbox({ imageUrl, caption, onClose }: LightboxProps) {
  // ESC 키로 닫기
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    // 스크롤 방지
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* 닫기 버튼 */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
        aria-label="닫기"
      >
        <X className="w-6 h-6" />
      </button>

      {/* 이미지 컨테이너 */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={caption || "Notion 이미지"}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />
        {caption && (
          <p className="mt-3 text-center text-sm text-white/80">{caption}</p>
        )}
      </div>

      {/* 클릭하여 닫기 안내 */}
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/50">
        클릭하거나 ESC를 눌러 닫기
      </p>
    </div>
  );
}

function ImagePlaceholder({ message }: { message: string }) {
  return (
    <div className="my-4 flex items-center justify-center gap-2 p-8 rounded-lg border border-dashed border-border bg-muted/30 text-muted-foreground">
      <ImageOff className="h-5 w-5" />
      <span className="text-sm">{message}</span>
    </div>
  );
}
