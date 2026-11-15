import * as React from "react";
import Link from "next/link";
import { CloudinaryImage } from "@/components/ui/cloudinary-image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { formatMoney } from "@/lib/format-money";
import { formatArabicDateString } from "@/lib/calendar-dates";
import { DISTRICT_LABELS } from "@/lib/districts";
import type { PublicProviderCardData } from "@/lib/marketplace-query";
import { cn } from "@/lib/cn";

export interface ProviderCardProps {
  provider: PublicProviderCardData;
  activeDate?: string | null;
  priority?: boolean;
}

export function ProviderCard({
  provider,
  activeDate,
  priority = false,
}: ProviderCardProps) {
  const districtLabel = DISTRICT_LABELS[provider.district] || provider.district;

  // Check if created within last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const isNew = provider.createdAt >= thirtyDaysAgo;

  return (
    <Link
      href={`/providers/${provider.slug}`}
      className="group flex flex-col overflow-hidden rounded-[4px] border border-border bg-surface-raised transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* 4:5 Cover Image Container with Hover Zoom */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-muted">
        <CloudinaryImage
          publicId={null}
          src={provider.coverUrl || undefined}
          alt={provider.name}
          aspectRatio="4:5"
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transform-none"
        />

        {/* Badges Over Cover */}
        <div className="absolute top-3 inset-x-3 flex flex-wrap items-center justify-between gap-1.5 pointer-events-none">
          {activeDate && (
            <Badge variant="success" size="sm" className="shadow-xs backdrop-blur-xs">
              متاح يوم {formatArabicDateString(activeDate)}
            </Badge>
          )}

          {provider.reviewCount === 0 && isNew && (
            <Badge variant="accent" size="sm" className="shadow-xs backdrop-blur-xs ms-auto">
              جديد
            </Badge>
          )}
        </div>
      </div>

      {/* Card Details */}
      <div className="flex flex-1 flex-col p-4">
        {/* Header: Logo + Title */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0 border border-border">
            {provider.logoUrl ? (
              <AvatarImage src={provider.logoUrl} alt={provider.name} />
            ) : null}
            <AvatarFallback>{provider.name.slice(0, 2)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h3 className="font-display font-semibold text-base text-text truncate group-hover:text-accent-text transition-colors">
              {provider.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5 truncate">
              {provider.primaryCategory && (
                <span>{provider.primaryCategory.nameAr}</span>
              )}
              {provider.primaryCategory && <span>•</span>}
              <span>{districtLabel}</span>
            </div>
          </div>
        </div>

        {/* Price & Rating Row */}
        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between gap-2">
          {/* Price */}
          <div className="text-xs">
            {provider.minPrice !== null ? (
              <span className="text-text">
                يبدأ من{" "}
                <span className="font-latin font-bold text-sm text-text">
                  {formatMoney(provider.minPrice)}
                </span>
              </span>
            ) : (
              <span className="text-text-muted">تواصلي لمعرفة السعر</span>
            )}
          </div>

          {/* Rating (ONLY when reviewCount > 0) */}
          {provider.reviewCount > 0 ? (
            <Rating
              value={provider.averageRating}
              count={provider.reviewCount}
              size="sm"
            />
          ) : (
            <span className="text-[11px] text-text-muted">بدون تقييمات بعد</span>
          )}
        </div>
      </div>
    </Link>
  );
}
