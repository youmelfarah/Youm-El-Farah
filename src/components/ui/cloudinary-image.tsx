"use client";

import * as React from "react";
import Image from "next/image";
import { resolveCloudinaryDisplayUrl, type CloudinaryImagePreset } from "@/lib/cloudinary-url";
import { Skeleton } from "@/components/ui/skeleton";
import { Placeholder } from "@/components/ui/placeholder";
import { cn } from "@/lib/cn";

export type ImageAspectRatio = "1:1" | "4:5" | "3:2" | "16:9" | "auto";

export interface CloudinaryImageProps {
  publicId?: string | null;
  fallbackUrl?: string | null;
  src?: string;
  alt: string;
  aspectRatio?: ImageAspectRatio;
  preset?: CloudinaryImagePreset;
  sizes?: string;
  priority?: boolean;
  className?: string;
  containerClassName?: string;
}

const aspectRatioClasses: Record<ImageAspectRatio, string> = {
  "1:1": "aspect-square",
  "4:5": "aspect-[4/5]",
  "3:2": "aspect-[3/2]",
  "16:9": "aspect-video",
  auto: "h-full w-full",
};

export function CloudinaryImage({
  publicId,
  fallbackUrl,
  src,
  alt,
  aspectRatio = "3:2",
  preset = "card",
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority = false,
  className,
  containerClassName,
}: CloudinaryImageProps) {
  const [isLoading, setIsLoading] = React.useState(true);

  const displayUrl = React.useMemo(() => {
    if (src) return src;
    return resolveCloudinaryDisplayUrl({
      publicId,
      fallbackUrl,
      preset,
    });
  }, [src, publicId, fallbackUrl, preset]);

  if (!displayUrl) {
    return (
      <div className={cn("overflow-hidden rounded-[2px]", aspectRatioClasses[aspectRatio], containerClassName)}>
        <Placeholder aspectRatio={aspectRatio} label={alt} className="h-full w-full" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2px] bg-surface-muted",
        aspectRatioClasses[aspectRatio],
        containerClassName
      )}
    >
      {isLoading && (
        <Skeleton className="absolute inset-0 z-10 h-full w-full rounded-none" />
      )}
      <Image
        src={displayUrl}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn(
          "object-cover transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
      />
    </div>
  );
}
