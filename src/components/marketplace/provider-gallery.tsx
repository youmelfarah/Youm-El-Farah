"use client";

import * as React from "react";
import Image from "next/image";
import {
  X,
  CaretLeft,
  CaretRight,
  Play,
  ArrowSquareOut,
  InstagramLogo,
  FacebookLogo,
  Images,
} from "@phosphor-icons/react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CloudinaryImage } from "@/components/ui/cloudinary-image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export interface MediaItem {
  id: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  cloudinaryPublicId?: string | null;
  caption?: string | null;
}

export interface ProviderGalleryProps {
  media: MediaItem[];
  providerName: string;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function isInstagramUrl(url: string): boolean {
  return /instagram\.com/i.test(url);
}

function isFacebookUrl(url: string): boolean {
  return /facebook\.com|fb\.watch/i.test(url);
}

export function ProviderGallery({ media, providerName }: ProviderGalleryProps) {
  const images = React.useMemo(() => media.filter((m) => m.type === "IMAGE"), [media]);
  const videos = React.useMemo(() => media.filter((m) => m.type === "VIDEO"), [media]);

  // Lightbox state
  const [activeImageIndex, setActiveImageIndex] = React.useState<number | null>(null);
  const [touchStartX, setTouchStartX] = React.useState<number | null>(null);

  // Video embed states (map of mediaId -> boolean loaded)
  const [loadedVideos, setLoadedVideos] = React.useState<Record<string, boolean>>({});

  const isLightboxOpen = activeImageIndex !== null;

  const handleOpenLightbox = (index: number) => {
    setActiveImageIndex(index);
  };

  const handleCloseLightbox = () => {
    setActiveImageIndex(null);
  };

  const handleNext = React.useCallback(() => {
    if (activeImageIndex === null || images.length <= 1) return;
    setActiveImageIndex((prev) => (prev! + 1) % images.length);
  }, [activeImageIndex, images.length]);

  const handlePrev = React.useCallback(() => {
    if (activeImageIndex === null || images.length <= 1) return;
    setActiveImageIndex((prev) => (prev! - 1 + images.length) % images.length);
  }, [activeImageIndex, images.length]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, handleNext, handlePrev]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX;

    // Threshold of 40px
    if (diff > 40) {
      // Swiped right -> in RTL, next or prev
      handleNext();
    } else if (diff < -40) {
      // Swiped left
      handlePrev();
    }
    setTouchStartX(null);
  };

  if (media.length === 0) {
    return (
      <div className="rounded-[4px] border border-border border-dashed p-8 text-center bg-surface-raised">
        <Images className="mx-auto h-8 w-8 text-text-muted" weight="light" />
        <p className="mt-2 text-sm text-text-muted">
          لم يقم مقدم الخدمة بإضافة صور أو فيديوهات للمعرض بعد.
        </p>
      </div>
    );
  }

  const currentImage = activeImageIndex !== null ? images[activeImageIndex] : null;

  return (
    <div className="flex flex-col gap-10">
      {/* 1. EDITORIAL PHOTOS GRID */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {images.map((item, idx) => {
            // Asymmetric editorial spans: first item spans 2 on tablet+
            const isFeatured = idx === 0 || idx === 7;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleOpenLightbox(idx)}
                className={cn(
                  "group relative overflow-hidden rounded-[2px] bg-surface-muted text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
                  isFeatured
                    ? "col-span-2 row-span-2 aspect-square"
                    : "aspect-[4/5]"
                )}
                aria-label={`عرض الصورة ${idx + 1} من ${images.length}: ${item.caption || providerName}`}
              >
                <CloudinaryImage
                  publicId={item.cloudinaryPublicId}
                  src={item.url}
                  alt={item.caption || `${providerName} - صورة ${idx + 1}`}
                  aspectRatio="auto"
                  sizes={
                    isFeatured
                      ? "(max-width: 768px) 100vw, 50vw"
                      : "(max-width: 768px) 50vw, 25vw"
                  }
                  className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transform-none"
                />

                {/* Subtle Hover Gradient & Caption */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 flex items-end p-3">
                  <span className="text-xs text-white truncate drop-shadow-xs">
                    {item.caption || "تكبير الصورة"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 2. VIDEOS SECTION */}
      {videos.length > 0 && (
        <div className="flex flex-col gap-4 pt-4 border-t border-border">
          <h4 className="font-display font-semibold text-base text-text">
            فيديوهات ومقاطع العمل
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((vid) => {
              const ytId = extractYouTubeId(vid.url);
              const isInsta = isInstagramUrl(vid.url);
              const isFb = isFacebookUrl(vid.url);

              if (ytId) {
                const isLoaded = Boolean(loadedVideos[vid.id]);

                if (isLoaded) {
                  return (
                    <div
                      key={vid.id}
                      className="relative aspect-video w-full overflow-hidden rounded-[4px] border border-border bg-black"
                    >
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`}
                        title={vid.caption || "فيديو يوتيوب"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="h-full w-full border-none"
                      />
                    </div>
                  );
                }

                // Click-to-load YouTube Facade
                return (
                  <button
                    key={vid.id}
                    type="button"
                    onClick={() => setLoadedVideos((prev) => ({ ...prev, [vid.id]: true }))}
                    className="group relative aspect-video w-full overflow-hidden rounded-[4px] border border-border bg-black text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                    aria-label={`تشغيل الفيديو: ${vid.caption || providerName}`}
                  >
                    <Image
                      src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                      alt={vid.caption || "صورة معاينة الفيديو"}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover opacity-80 transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-raised text-text shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="h-6 w-6 text-text fill-current ms-0.5" weight="fill" />
                      </div>
                    </div>
                    {vid.caption && (
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-xs text-white truncate text-start">
                        {vid.caption}
                      </div>
                    )}
                  </button>
                );
              }

              // Facebook / Instagram Link Cards
              return (
                <a
                  key={vid.id}
                  href={vid.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-[4px] border border-border bg-surface-raised p-4 transition-colors hover:border-border-strong hover:bg-surface-muted group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] bg-surface-muted text-text">
                      {isInsta ? (
                        <InstagramLogo className="h-5 w-5" weight="regular" />
                      ) : isFb ? (
                        <FacebookLogo className="h-5 w-5" weight="regular" />
                      ) : (
                        <Play className="h-5 w-5" weight="regular" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text truncate">
                        {vid.caption || (isInsta ? "مشاهدة الفيديو على إنستغرام" : "مشاهدة الفيديو على فيسبوك")}
                      </p>
                      <span className="text-xs text-text-muted">
                        فتح في نافذة جديدة
                      </span>
                    </div>
                  </div>
                  <ArrowSquareOut className="h-5 w-5 shrink-0 text-text-muted group-hover:text-text transition-colors" />
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. RADIX DIALOG LIGHTBOX */}
      <Dialog open={isLightboxOpen} onOpenChange={(open) => !open && handleCloseLightbox()}>
        <DialogContent
          className="max-w-4xl p-0 overflow-hidden bg-black/95 border-neutral-800 text-white rounded-[4px]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {currentImage && (
            <div className="relative flex flex-col items-center justify-center min-h-[60vh] max-h-[85vh]">
              {/* Close Button is natively rendered by DialogContent */}

              {/* Main Image */}
              <div className="relative w-full h-[65vh] flex items-center justify-center p-2">
                <Image
                  src={currentImage.url}
                  alt={currentImage.caption || `${providerName} - صورة ${activeImageIndex! + 1}`}
                  fill
                  className="object-contain"
                  priority
                  sizes="100vw"
                />
              </div>

              {/* Controls & Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="الصورة السابقة"
                    className="absolute start-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <CaretRight className="h-6 w-6" weight="bold" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="الصورة التالية"
                    className="absolute end-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <CaretLeft className="h-6 w-6" weight="bold" />
                  </button>
                </>
              )}

              {/* Footer / Caption */}
              <div className="w-full bg-black/80 px-4 py-3 flex items-center justify-between text-xs text-neutral-300 border-t border-neutral-800">
                <span className="truncate max-w-[70%]">
                  {currentImage.caption || providerName}
                </span>
                <span className="font-latin font-medium">
                  {activeImageIndex! + 1} / {images.length}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
