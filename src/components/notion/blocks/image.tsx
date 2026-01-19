"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import type { ImageBlock } from "@/types/notion-blocks";

interface ImageProps {
  block: ImageBlock;
}

export function NotionImage({ block }: ImageProps) {
  const { image } = block;
  const [error, setError] = useState(false);

  // 원본 URL 가져오기
  const originalUrl =
    image.type === "file" ? image.file?.url : image.external?.url;

  if (!originalUrl) {
    return <ImagePlaceholder message="이미지 URL을 찾을 수 없습니다" />;
  }

  // 프록시 URL 생성 (Notion S3 이미지만)
  const isNotionS3 = originalUrl.includes("s3.us-west-2.amazonaws.com");
  const imageUrl = isNotionS3
    ? `/api/notion/image?url=${encodeURIComponent(originalUrl)}`
    : originalUrl;

  // 캡션
  const caption = image.caption?.map((t) => t.plain_text).join("") || "";

  if (error) {
    return <ImagePlaceholder message="이미지를 불러올 수 없습니다" />;
  }

  return (
    <figure className="my-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={caption || "Notion 이미지"}
        className="max-w-full h-auto rounded-lg border border-border"
        loading="lazy"
        onError={() => setError(true)}
      />
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
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
