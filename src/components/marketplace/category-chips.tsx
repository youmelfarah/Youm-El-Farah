import * as React from "react";
import Link from "next/link";
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

  const isAllActive = !activeCategorySlug;

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex items-center gap-2 min-w-max">
        {/* All Services Chip */}
        <Link
          href={buildHref()}
          className={cn(
            "min-h-[44px] inline-flex items-center justify-center rounded-[4px] px-4 text-xs font-medium transition-colors border",
            isAllActive
              ? "bg-text text-text-inverse border-text"
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
                "min-h-[44px] inline-flex items-center justify-center rounded-[4px] px-4 text-xs font-medium transition-colors border",
                isActive
                  ? "bg-text text-text-inverse border-text"
                  : "bg-surface-raised text-text border-border hover:bg-surface-muted hover:border-border-strong"
              )}
            >
              {cat.nameAr}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
