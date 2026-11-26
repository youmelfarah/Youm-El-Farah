"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  ArrowLeft,
  Building2,
  Camera,
  Palette,
  Sparkles,
  Flower2,
  Car,
  Heart,
} from "lucide-react";
import { formatMoney } from "@/lib/format-money";
import { formatArabicDateString } from "@/lib/calendar-dates";
import { DISTRICT_LABELS } from "@/lib/districts";
import { cn } from "@/lib/cn";
import type { PublicProviderCardData } from "@/lib/marketplace-query";
import { FavoriteButton } from "@/components/marketplace/favorite-button";

export interface ProviderCardProps {
  provider: PublicProviderCardData;
  activeDate?: string | null;
  priority?: boolean;
  initialFavorited?: boolean;
  showFavoriteButton?: boolean;
}

interface CategoryFallbackStyle {
  gradient: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  textColor: string;
}

function getCategoryFallbackStyle(slug?: string, nameAr?: string): CategoryFallbackStyle {
  switch (slug) {
    case "venues":
    case "hotels":
      return {
        gradient: "from-[#FBF3E4] via-[#FFF7EC] to-[#F5E6D3]",
        icon: Building2,
        label: nameAr || "قاعات ومناسبات",
        textColor: "text-[#C4935B]",
      };
    case "photographer":
    case "videographer":
    case "media-coverage":
      return {
        gradient: "from-[#F3ECFA] via-[#FAF2F8] to-[#FCECEF]",
        icon: Camera,
        label: nameAr || "تصوير وتوثيق",
        textColor: "text-[#7E4C88]",
      };
    case "makeup-artist":
    case "hair-artist":
      return {
        gradient: "from-[#FCECEF] via-[#FFF1E6] to-[#FCEEE5]",
        icon: Palette,
        label: nameAr || "ميك أب وتجميل",
        textColor: "text-[#B84A62]",
      };
    case "atelier":
    case "dress-accessories":
      return {
        gradient: "from-[#FFF0F3] via-[#FFE4E8] to-[#FFF4EE]",
        icon: Sparkles,
        label: nameAr || "أتيليه وأزياء",
        textColor: "text-[#B84A62]",
      };
    case "flowers":
      return {
        gradient: "from-[#F0F7F2] via-[#FDF5F7] to-[#FCECEF]",
        icon: Flower2,
        label: nameAr || "بيكيهات وورود",
        textColor: "text-[#2E5E3E]",
      };
    case "wedding-car":
      return {
        gradient: "from-[#F5F2F9] via-[#FAF6EE] to-[#FDF8F2]",
        icon: Car,
        label: nameAr || "عربية الزفاف",
        textColor: "text-[#7A5F34]",
      };
    default:
      return {
        gradient: "from-[#FDF8F3] via-[#FAF2E8] to-[#FCECEF]",
        icon: Heart,
        label: nameAr || "خدمات زفاف",
        textColor: "text-[#B84A62]",
      };
  }
}

export function ProviderCard({
  provider,
  activeDate,
  priority = false,
  initialFavorited,
  showFavoriteButton = true,
}: ProviderCardProps) {
  const [imgError, setImgError] = React.useState(false);
  const districtLabel = DISTRICT_LABELS[provider.district] || provider.district;

  const categoryStyle = getCategoryFallbackStyle(
    provider.primaryCategory?.slug,
    provider.primaryCategory?.nameAr
  );
  const CategoryIcon = categoryStyle.icon;

  const hasValidImage = Boolean(provider.coverUrl && !imgError);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#EFE5DA] bg-white shadow-sm hover:shadow-lg hover:border-[#E5C9C0] transition-all duration-300">
      {showFavoriteButton && (
        <React.Suspense fallback={null}>
          <FavoriteButton
            providerId={provider.id}
            initialFavorited={initialFavorited}
            variant="card"
            className="absolute top-3 start-3 z-10"
          />
        </React.Suspense>
      )}

      <Link
        href={`/providers/${provider.slug}`}
        className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B84A62] rounded-2xl"
      >
      {/* 4:3 Cover Image Frame with Hover Zoom */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-[#F8F4EE]">
        {hasValidImage ? (
          <Image
            src={provider.coverUrl!}
            alt={provider.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transform-none"
          />
        ) : (
          /* Joyful Category-Aware Fallback Cover */
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-br transition-transform duration-500 ease-out group-hover:scale-105 select-none",
              categoryStyle.gradient
            )}
          >
            {/* Subtle decorative geometric / arch SVG pattern at 15% opacity */}
            <svg
              className="absolute inset-0 w-full h-full opacity-15 pointer-events-none text-[#2A1E1B]"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 200 150"
              fill="none"
              stroke="currentColor"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M20,150 Q100,15 180,150" strokeWidth="1.5" />
              <path d="M45,150 Q100,45 155,150" strokeWidth="1" />
              <circle cx="100" cy="50" r="16" strokeWidth="1" />
              <path d="M100,0 L100,34" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="50" cy="35" r="2" fill="currentColor" />
              <circle cx="150" cy="35" r="2" fill="currentColor" />
            </svg>

            {/* Centered frosted circular badge */}
            <div className="relative z-10 w-14 h-14 rounded-full bg-white/85 backdrop-blur-sm border border-white/90 shadow-sm flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <CategoryIcon className={cn("w-6 h-6", categoryStyle.textColor)} />
            </div>

            {/* Category label underneath */}
            <span className="relative z-10 text-xs font-semibold text-[#2A1E1B]/80 mt-2.5 tracking-wide">
              {categoryStyle.label}
            </span>
          </div>
        )}

        {/* Badges Over Cover */}
        <div className="absolute bottom-3 start-3 pointer-events-none">
          {activeDate && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/90 text-white px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>متاح يوم {formatArabicDateString(activeDate)}</span>
            </span>
          )}
        </div>
        <div className="absolute top-3 end-3 pointer-events-none">
          {provider.reviewCount > 0 ? (
            <div
              className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#2A1E1B] shadow-sm backdrop-blur-sm"
              dir="ltr"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
              <span>{provider.averageRating.toFixed(1)}</span>
              <span className="text-stone-500 font-normal">({provider.reviewCount})</span>
            </div>
          ) : (
            <span className="inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#B84A62] shadow-sm backdrop-blur-sm">
              جديد
            </span>
          )}
        </div>
      </div>

      {/* Card Details (Redundant mini avatar cleanly removed) */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-base text-[#2A1E1B] line-clamp-1 group-hover:text-[#B84A62] transition-colors">
            {provider.name}
          </h3>
          <div className="flex items-center gap-2 text-xs text-[#6B625A] mt-1 truncate">
            {provider.primaryCategory && (
              <span className="text-[#9E3B52] font-medium">{provider.primaryCategory.nameAr}</span>
            )}
            {provider.primaryCategory && <span className="text-[#D8C7B5]">•</span>}
            <span>{districtLabel}</span>
          </div>
        </div>

        {/* Price & CTA Row */}
        <div className="mt-auto pt-3.5 border-t border-[#EFE5DA] flex items-center justify-between gap-2">
          {/* Price */}
          <div className="text-xs whitespace-nowrap shrink-0">
            {provider.minPrice !== null ? (
              <span className="text-[#2A1E1B]">
                يبدأ من{" "}
                <span className="font-latin font-bold text-sm text-[#2A1E1B] whitespace-nowrap">
                  {formatMoney(provider.minPrice)}
                </span>
              </span>
            ) : (
              <span className="text-[#6B625A]">تواصلي لمعرفة السعر</span>
            )}
          </div>

          {/* Details CTA Cue */}
          <div className="inline-flex items-center gap-1 text-xs font-semibold text-[#B84A62] group-hover:text-[#9E3B52] transition-colors">
            <span>عرض التفاصيل</span>
            <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
    </div>
  );
}

// Export shared alias ServiceCard for compatibility
export const ServiceCard = ProviderCard;
