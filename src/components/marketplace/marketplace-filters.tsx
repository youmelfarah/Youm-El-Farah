"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { MagnifyingGlass, FadersHorizontal, ArrowsDownUp } from "@phosphor-icons/react";
import { DISTRICT_OPTIONS } from "@/lib/districts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { WeddingDatePicker } from "@/components/wedding-date/wedding-date-picker";
import type { ValidatedListingParams } from "@/lib/marketplace-query";

export interface MarketplaceFiltersProps {
  initialParams: ValidatedListingParams;
  totalCount: number;
  cookieDate?: string | null;
  children?: React.ReactNode;
}

const SORT_OPTIONS = [
  { value: "rating", label: "الأعلى تقييماً" },
  { value: "newest", label: "الأحدث انضماماً" },
  { value: "price_asc", label: "السعر: من الأقل للأعلى" },
  { value: "price_desc", label: "السعر: من الأعلى للأقل" },
];

export function MarketplaceFilters({
  initialParams,
  totalCount,
  cookieDate,
  children,
}: MarketplaceFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [mobileSheetOpen, setMobileSheetOpen] = React.useState(false);

  // Local state for filters
  const [q, setQ] = React.useState(initialParams.q || "");
  const [district, setDistrict] = React.useState<string>(initialParams.district || "ALL");
  const [minPrice, setMinPrice] = React.useState<string>(
    initialParams.minPrice !== undefined ? String(initialParams.minPrice) : ""
  );
  const [maxPrice, setMaxPrice] = React.useState<string>(
    initialParams.maxPrice !== undefined ? String(initialParams.maxPrice) : ""
  );
  const [date, setDate] = React.useState<string | null>(initialParams.date || cookieDate || null);
  const [sort, setSort] = React.useState<"rating" | "newest" | "price_asc" | "price_desc">(
    initialParams.sort || "rating"
  );

  // Keep in sync when initialParams changes
  React.useEffect(() => {
    setQ(initialParams.q || "");
    setDistrict(initialParams.district || "ALL");
    setMinPrice(initialParams.minPrice !== undefined ? String(initialParams.minPrice) : "");
    setMaxPrice(initialParams.maxPrice !== undefined ? String(initialParams.maxPrice) : "");
    setDate(initialParams.date || cookieDate || null);
    setSort(initialParams.sort || "rating");
  }, [initialParams, cookieDate]);

  // Compute active filters count
  const activeCount = React.useMemo(() => {
    let count = 0;
    if (initialParams.q) count++;
    if (initialParams.district) count++;
    if (initialParams.minPrice !== undefined) count++;
    if (initialParams.maxPrice !== undefined) count++;
    if (initialParams.date) count++;
    if (initialParams.sort && initialParams.sort !== "rating") count++;
    return count;
  }, [initialParams]);

  // Navigate with updated search params
  const applyFilters = (overrides?: Partial<{
    q: string;
    district: string;
    minPrice: string;
    maxPrice: string;
    date: string | null;
    sort: string;
  }>) => {
    const sp = new URLSearchParams();

    const targetQ = overrides?.q !== undefined ? overrides.q : q;
    const targetDistrict = overrides?.district !== undefined ? overrides.district : district;
    const targetMinPrice = overrides?.minPrice !== undefined ? overrides.minPrice : minPrice;
    const targetMaxPrice = overrides?.maxPrice !== undefined ? overrides.maxPrice : maxPrice;
    const targetDate = overrides?.date !== undefined ? overrides.date : date;
    const targetSort = overrides?.sort !== undefined ? overrides.sort : sort;

    if (targetQ.trim()) sp.set("q", targetQ.trim());
    if (targetDistrict && targetDistrict !== "ALL") sp.set("district", targetDistrict);
    if (targetMinPrice.trim()) sp.set("minPrice", targetMinPrice.trim());
    if (targetMaxPrice.trim()) sp.set("maxPrice", targetMaxPrice.trim());
    if (targetDate) sp.set("date", targetDate);
    if (targetSort && targetSort !== "rating") sp.set("sort", targetSort);

    // Resets to page 1 on filter change
    const qs = sp.toString();
    const targetUrl = qs ? `${pathname}?${qs}` : pathname;
    router.push(targetUrl);
    setMobileSheetOpen(false);
  };

  const handleReset = () => {
    setQ("");
    setDistrict("ALL");
    setMinPrice("");
    setMaxPrice("");
    setDate(null);
    setSort("rating");
    router.push(pathname);
    setMobileSheetOpen(false);
  };

  const handleSortChange = (newSort: string) => {
    const validSort = (newSort as "rating" | "newest" | "price_asc" | "price_desc") || "rating";
    setSort(validSort);
    applyFilters({ sort: validSort });
  };

  const filterFormContent = (
    <div className="flex flex-col gap-5">
      {/* Search by Name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-q" className="text-xs font-semibold text-text">
          البحث بالاسم
        </Label>
        <div className="relative">
          <Input
            id="filter-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                applyFilters();
              }
            }}
            placeholder="اسم مقدم الخدمة..."
            className="pe-9"
          />
          <MagnifyingGlass className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
        </div>
      </div>

      {/* District Select */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-district" className="text-xs font-semibold text-text">
          المركز أو المدينة
        </Label>
        <Select
          value={district}
          onValueChange={(val) => {
            setDistrict(val);
            applyFilters({ district: val });
          }}
        >
          <SelectTrigger id="filter-district">
            <SelectValue placeholder="جميع المراكز" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">جميع مراكز بني سويف</SelectItem>
            {DISTRICT_OPTIONS.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Wedding Date Filter */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-semibold text-text">
          تاريخ يوم الفرح
        </Label>
        <WeddingDatePicker
          currentDate={date}
          onSelectDate={(newDate) => {
            setDate(newDate);
            applyFilters({ date: newDate });
          }}
          onClearDate={() => {
            setDate(null);
            applyFilters({ date: null });
          }}
          className="w-full justify-between"
        />
      </div>

      {/* Price Range */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-semibold text-text">
          نطاق السعر (ج.م)
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            min={0}
            max={1000000}
            placeholder="من"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={() => applyFilters()}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters();
            }}
          />
          <Input
            type="number"
            min={0}
            max={1000000}
            placeholder="إلى"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={() => applyFilters()}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters();
            }}
          />
        </div>
      </div>

      {/* Apply / Reset buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <Button
          type="button"
          variant="primary"
          onClick={() => applyFilters()}
          className="flex-1 min-h-[44px]"
        >
          تطبيق الفلاتر
        </Button>
        {activeCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            className="text-xs text-text-muted hover:text-danger min-h-[44px]"
          >
            مسح
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
      {/* Desktop Filters Sidebar (starts at the exact same top line as results) */}
      <aside className="hidden lg:block w-72 shrink-0">
        <div className="sticky top-20 rounded-[4px] border border-border bg-surface-raised p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <FadersHorizontal className="h-4 w-4 text-accent-text" weight="bold" />
              <h3 className="font-display font-semibold text-sm text-text">
                خيارات التصفية
              </h3>
            </div>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-text-muted hover:text-danger transition-colors"
              >
                مسح الكل
              </button>
            )}
          </div>
          {filterFormContent}
        </div>
      </aside>

      {/* Main Results Column (uses available width) */}
      <div className="flex-1 w-full min-w-0">
        {/* Sticky Bar above Results: Count, Sort Dropdown, and Mobile Sheet trigger */}
        <div className="sticky top-16 z-30 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/95 py-3 backdrop-blur-xs">
          {/* Count */}
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-base text-text">
              {totalCount}{" "}
              <span className="text-xs font-normal text-text-muted font-body">
                {totalCount === 1 ? "مقدم خدمة" : totalCount === 2 ? "مقدما خدمة" : "مقدمي خدمات"}
              </span>
            </span>
          </div>

          {/* Sort & Mobile Filter Button */}
          <div className="flex items-center gap-2">
            {/* Mobile Filters Sheet Trigger */}
            <div className="lg:hidden">
              <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-[44px] gap-2 text-xs"
                  >
                    <FadersHorizontal className="h-4 w-4" weight="light" />
                    <span>تصفية</span>
                    {activeCount > 0 && (
                      <Badge variant="accent" size="sm" className="px-1.5 py-0 h-4 min-w-[16px]">
                        {activeCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-[12px] p-5 max-h-[90vh] overflow-y-auto">
                  <SheetHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
                    <SheetTitle className="text-base font-bold font-display text-text">
                      تصفية النتائج
                    </SheetTitle>
                    {activeCount > 0 && (
                      <button
                        type="button"
                        onClick={handleReset}
                        className="text-xs text-danger hover:underline"
                      >
                        مسح الكل
                      </button>
                    )}
                  </SheetHeader>
                  <div className="py-4">{filterFormContent}</div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-1.5">
              <ArrowsDownUp className="h-4 w-4 text-text-muted hidden sm:inline" />
              <Select value={sort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[170px] sm:w-[190px] h-10 text-xs">
                  <SelectValue placeholder="الترتيب" />
                </SelectTrigger>
                <SelectContent align="end">
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results Content / Grid / Empty State */}
        {children}
      </div>
    </div>
  );
}
