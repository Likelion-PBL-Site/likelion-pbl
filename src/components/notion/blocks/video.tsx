"use client";

import { useState } from "react";
import { VideoOff, Info, Loader2 } from "lucide-react";
import type { VideoBlock } from "@/types/notion-blocks";

interface VideoProps {
  block: VideoBlock;
}

export function NotionVideo({ block }: VideoProps) {
  const { video } = block;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // 원본 URL 가져오기
  const originalUrl =
    video.type === "file" ? video.file?.url : video.external?.url;

  if (!originalUrl) {
    return <VideoPlaceholder message="비디오 URL을 찾을 수 없습니다" />;
  }

  // YouTube/Vimeo 외부 링크 감지
  const youtubeMatch = originalUrl.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/
  );
  const vimeoMatch = originalUrl.match(/vimeo\.com\/(\d+)/);

  // 캡션
  const caption = video.caption?.map((t) => t.plain_text).join("") || "";

  if (error) {
    return <VideoPlaceholder message="비디오를 불러올 수 없습니다" />;
  }

  // YouTube 임베드
  if (youtubeMatch) {
    return (
      <VideoContainer caption={caption}>
        <iframe
          src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
          title={caption || "YouTube 비디오"}
          className="w-full aspect-video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </VideoContainer>
    );
  }

  // Vimeo 임베드
  if (vimeoMatch) {
    return (
      <VideoContainer caption={caption}>
        <iframe
          src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
          title={caption || "Vimeo 비디오"}
          className="w-full aspect-video"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </VideoContainer>
    );
  }

  // Notion S3 파일 비디오 - 비디오 프록시 사용
  const isNotionS3 = originalUrl.includes("s3.us-west-2.amazonaws.com");
  const shouldIncludeBlockId = isNotionS3 && video.type === "file";
  const proxyParams = new URLSearchParams({ url: originalUrl });
  if (shouldIncludeBlockId) {
    proxyParams.set("blockId", block.id);
  }

  const videoUrl = isNotionS3
    ? `/api/notion/video?${proxyParams.toString()}`
    : originalUrl;

  return (
    <VideoContainer caption={caption}>
      <div className="relative w-full">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 backdrop-blur-sm z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <span className="text-sm text-muted-foreground">비디오 로딩 중...</span>
          </div>
        )}
        <video
          src={videoUrl}
          controls
          className="w-full rounded-lg"
          preload="metadata"
          onLoadedData={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError(true);
          }}
        >
          <track kind="captions" />
          브라우저가 비디오 태그를 지원하지 않습니다.
        </video>
      </div>
    </VideoContainer>
  );
}

interface VideoContainerProps {
  caption: string;
  children: React.ReactNode;
}

function VideoContainer({ caption, children }: VideoContainerProps) {
  return (
    <figure className="my-6 max-w-2xl mx-auto">
      <div className="rounded-xl overflow-hidden border border-border bg-card shadow-sm">
        {children}
        {caption && (
          <figcaption className="px-4 py-3 text-sm text-muted-foreground bg-muted/30 border-t border-border flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0 text-muted-foreground/70" />
            <span>{caption}</span>
          </figcaption>
        )}
      </div>
    </figure>
  );
}

function VideoPlaceholder({ message }: { message: string }) {
  return (
    <div className="my-4 flex items-center justify-center gap-2 p-8 rounded-lg border border-dashed border-border bg-muted/30 text-muted-foreground">
      <VideoOff className="h-5 w-5" />
      <span className="text-sm">{message}</span>
    </div>
  );
}
