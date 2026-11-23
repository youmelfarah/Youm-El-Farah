"use client";

import * as React from "react";
import Link from "next/link";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

export interface CategoryChipItem {
  id: string;
  slug: string;
  nameAr: string;
}

export interface CategoryChipsProps {
  categories: CategoryChipItem[];
  activeCategorySlug?: string;
  searchParams?: Record<string, string | number | undefined>;
}

export function CategoryChips({
  categories,
  activeCategorySlug,
  searchParams = {},
}: CategoryChipsProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);

  const buildHref = (slug?: string) => {
    const basePath = slug ? `/services/${slug}` : "/services";
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== "" && key !== "page") {
        sp.set(key, String(value));
      }
    }
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const checkScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 2) {
      setCanScrollRight(false);
      setCanScrollLeft(false);
      return;
    }

    const abs = Math.abs(scrollLeft);
    // Standard RTL in modern browsers (scrollLeft <= 0):
    // scrollLeft === 0 is the start (visual right edge)
    // scrollLeft decreases to -maxScroll at the end (visual left edge)
    if (scrollLeft <= 0) {
      setCanScrollRight(abs > 5);
      setCanScrollLeft(abs < maxScroll - 5);
    } else {
      // Browsers with inverted or positive RTL scrollLeft
      setCanScrollRight(scrollLeft > 5);
      setCanScrollLeft(scrollLeft < maxScroll - 5);
    }
  }, []);

  React.useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, categories]);

  const scrollRight = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: 240, behavior: "smooth" });
  };

  const scrollLeft = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: -240, behavior: "smooth" });
  };

  const isAllActive = !activeCategorySlug;

  return (
    <div className="relative w-full py-1">
      {/* Right Circular Navigation Arrow Button (Desktop - scrolls to start) */}
      {canScrollRight && (
        <button
          type="button"
          onClick={scrollRight}
          aria-label="تمرير إلى اليمين"
          className="hidden md:flex absolute start-0 top-1/2 -translate-y-1/2 z-20 h-9 w-9 items-center justify-center rounded-full bg-surface-raised/95 backdrop-blur-sm border border-border shadow-sm text-text hover:text-accent-text hover:bg-surface transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CaretRight className="h-4 w-4" weight="bold" />
        </button>
      )}

      {/* Right Edge Fade Mask */}
      {canScrollRight && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 start-0 z-10 w-12 bg-gradient-to-l from-surface-raised to-transparent"
        />
      )}

      {/* Horizontal Scroll Strip */}
      <div
        ref={scrollRef}
        className="w-full overflow-x-auto snap-x snap-mandatory scroll-smooth py-2 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <div className="flex items-center gap-2 min-w-max">
          {/* All Services Chip */}
          <Link
            href={buildHref()}
            className={cn(
              "min-h-[44px] shrink-0 snap-start inline-flex items-center justify-center rounded-full px-5 text-xs sm:text-sm font-medium transition-colors border",
              isAllActive
                ? "bg-text text-text-inverse border-text shadow-xs"
                : "bg-surface-raised text-text border-border hover:bg-surface-muted hover:border-border-strong"
            )}
          >
            جميع الخدمات
          </Link>

          {/* Category Chips */}
          {categories.map((cat) => {
            const isActive = activeCategorySlug === cat.slug;
            return (
              <Link
                key={cat.id}
                href={buildHref(cat.slug)}
                className={cn(
                  "min-h-[44px] shrink-0 snap-start inline-flex items-center justify-center rounded-full px-5 text-xs sm:text-sm font-medium transition-colors border",
                  isActive
                    ? "bg-text text-text-inverse border-text shadow-xs"
                    : "bg-surface-raised text-text border-border hover:bg-surface-muted hover:border-border-strong"
                )}
              >
                {cat.nameAr}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Left Edge Fade Mask */}
      {canScrollLeft && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 end-0 z-10 w-12 bg-gradient-to-r from-surface-raised to-transparent"
        />
      )}

      {/* Left Circular Navigation Arrow Button (Desktop - scrolls to end) */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={scrollLeft}
          aria-label="تمرير إلى اليسار"
          className="hidden md:flex absolute end-0 top-1/2 -translate-y-1/2 z-20 h-9 w-9 items-center justify-center rounded-full bg-surface-raised/95 backdrop-blur-sm border border-border shadow-sm text-text hover:text-accent-text hover:bg-surface transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CaretLeft className="h-4 w-4" weight="bold" />
        </button>
      )}
    </div>
  );
}
