import * as React from "react";
import Link from "next/link";
import { CalendarX, MagnifyingGlass, Funnel } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { formatArabicDateString } from "@/lib/calendar-dates";

export interface ListingEmptyStateProps {
  isDateExclusion: boolean;
  activeDate?: string | null;
  resetUrl: string;
}

export function ListingEmptyState({
  isDateExclusion,
  activeDate,
  resetUrl,
}: ListingEmptyStateProps) {
  if (isDateExclusion && activeDate) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[8px] border border-border border-dashed bg-surface-raised p-8 sm:p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-muted text-accent-text mb-4">
          <CalendarX className="h-7 w-7" weight="light" />
        </div>
        <h3 className="font-display font-bold text-lg text-text">
          مفيش متاح يوم {formatArabicDateString(activeDate)}
        </h3>
        <p className="mt-2 text-sm text-text-muted max-w-md leading-relaxed">
          جربي اختيار تاريخ زفاف تاني، أو تصفحي قائمة مقدمي الخدمات من غير تحديد تاريخ.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="primary" size="md">
            <Link href={resetUrl}>تصفحي من غير تاريخ</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-[8px] border border-border border-dashed bg-surface-raised p-8 sm:p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-muted text-text-muted mb-4">
        <MagnifyingGlass className="h-7 w-7" weight="light" />
      </div>
      <h3 className="font-display font-bold text-lg text-text">
        لم نجد نتائج مطابقة لبحثكِ
      </h3>
      <p className="mt-2 text-sm text-text-muted max-w-md leading-relaxed">
        جربي تغيير كلمات البحث أو تخفيف الفلاتر المحددة (مثل المركز أو نطاق السعر).
      </p>
      <div className="mt-6 flex items-center justify-center">
        <Button asChild variant="secondary" size="md">
          <Link href={resetUrl}>مسح الفلاتر والبدء من جديد</Link>
        </Button>
      </div>
    </div>
  );
}
