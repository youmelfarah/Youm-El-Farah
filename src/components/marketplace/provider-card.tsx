import * as React from "react";
import Link from "next/link";
import { Star, ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { CloudinaryImage } from "@/components/ui/cloudinary-image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format-money";
import { formatArabicDateString } from "@/lib/calendar-dates";
import { DISTRICT_LABELS } from "@/lib/districts";
import type { PublicProviderCardData } from "@/lib/marketplace-query";

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

  return (
    <Link
      href={`/providers/${provider.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-raised transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* 4:3 Cover Image Container with Hover Zoom */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-surface-muted">
        <CloudinaryImage
          publicId={null}
          src={provider.coverUrl || undefined}
          alt={provider.name}
          aspectRatio="auto"
          containerClassName="h-full w-full rounded-none"
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transform-none"
        />

        {/* Badges Over Cover */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-none">
          {/* Availability badge at top-right (start in RTL) */}
          <div>
            {activeDate && (
              <Badge variant="success" size="sm" className="rounded-full shadow-xs backdrop-blur-xs font-medium">
                متاح يوم {formatArabicDateString(activeDate)}
              </Badge>
            )}
          </div>

          {/* Frosted rating or new pill badge at top-left (end in RTL) */}
          <div>
            {provider.reviewCount > 0 ? (
              <div
                className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-stone-900 shadow-sm backdrop-blur-sm"
                dir="ltr"
              >
                <Star className="h-3.5 w-3.5 text-amber-500" weight="fill" />
                <span>{provider.averageRating.toFixed(1)}</span>
                <span className="text-stone-500 font-normal">({provider.reviewCount})</span>
              </div>
            ) : (
              <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-accent-text shadow-sm backdrop-blur-sm">
                جديد
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Details */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Header: Logo + Title */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0 border border-border">
            {provider.logoUrl ? (
              <AvatarImage src={provider.logoUrl} alt={provider.name} />
            ) : null}
            <AvatarFallback>{provider.name.slice(0, 2)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h3 className="font-display font-semibold text-base text-text line-clamp-1 group-hover:text-accent-text transition-colors">
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

        {/* Price & CTA Row */}
        <div className="mt-auto pt-3 border-t border-border/60 flex items-center justify-between gap-2">
          {/* Price */}
          <div className="text-xs whitespace-nowrap shrink-0">
            {provider.minPrice !== null ? (
              <span className="text-text">
                يبدأ من{" "}
                <span className="font-latin font-bold text-sm text-text whitespace-nowrap">
                  {formatMoney(provider.minPrice)}
                </span>
              </span>
            ) : (
              <span className="text-text-muted">تواصلي لمعرفة السعر</span>
            )}
          </div>

          {/* Details CTA Cue */}
          <div className="inline-flex items-center gap-1 text-xs font-medium text-accent-text group-hover:text-accent-hover transition-colors">
            <span>عرض التفاصيل</span>
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" weight="bold" />
          </div>
        </div>
      </div>
    </Link>
  );
}
