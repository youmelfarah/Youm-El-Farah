"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WeddingDatePicker } from "@/components/wedding-date/wedding-date-picker";
import { homeContent } from "@/content/home";

export interface HomeSearchCategory {
  id: string;
  slug: string;
  nameAr: string;
}

export interface HomeSearchCardProps {
  categories: HomeSearchCategory[];
  initialWeddingDate?: string | null;
}

export function HomeSearchCard({
  categories,
  initialWeddingDate = null,
}: HomeSearchCardProps) {
  const router = useRouter();
  const [category, setCategory] = React.useState<string>("ALL");
  const [date, setDate] = React.useState<string | null>(initialWeddingDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const basePath = category === "ALL" ? "/services" : `/services/${category}`;
    const url = date ? `${basePath}?date=${encodeURIComponent(date)}` : basePath;
    router.push(url);
  };

  const cardContent = homeContent.hero.searchCard;

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-[4px] border border-border bg-surface-raised p-4 sm:p-5 shadow-xl transition-colors"
      aria-label="البحث عن خدمات ومقدمي الأفراح"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
        {/* Category Select */}
        <div className="flex flex-col gap-1.5 sm:col-span-5">
          <label htmlFor="hero-category-select" className="text-xs font-semibold text-text">
            نوع الخدمة
          </label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger
              id="hero-category-select"
              className="h-11 w-full text-xs font-medium bg-surface text-text min-h-[44px]"
            >
              <SelectValue placeholder={cardContent.categoryPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{cardContent.allCategories}</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.slug}>
                  {c.nameAr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Wedding Date Picker */}
        <div className="flex flex-col gap-1.5 sm:col-span-4">
          <label className="text-xs font-semibold text-text">
            يوم الفرح
          </label>
          <WeddingDatePicker
            currentDate={date}
            onSelectDate={(newDate) => setDate(newDate)}
            onClearDate={() => setDate(null)}
            variant="solid"
            className="w-full justify-between h-11 text-xs min-h-[44px]"
          />
        </div>

        {/* Action Button */}
        <div className="sm:col-span-3">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full h-11 min-h-[44px] text-xs font-semibold gap-2"
          >
            <MagnifyingGlass className="h-4 w-4 shrink-0" weight="bold" />
            <span>{cardContent.submitButton}</span>
          </Button>
        </div>
      </div>
    </form>
  );
}
