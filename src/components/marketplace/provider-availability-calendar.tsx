"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CaretLeft,
  CaretRight,
  WhatsappLogo,
  CheckCircle,
  XCircle,
  Info,
} from "@phosphor-icons/react";
import {
  ARABIC_MONTHS,
  ARABIC_WEEKDAYS_SHORT,
  daysInMonth,
  formatArabicDateString,
  formatYmd,
  getFirstWeekdayOffsetSaturdayStart,
  getCairoTodayString,
  addMonthsToDateString,
  parseDateString,
} from "@/lib/calendar-dates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { setWeddingDate } from "@/lib/wedding-date";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { trackContactClick } from "@/lib/track-client";
import { cn } from "@/lib/cn";

export interface ProviderAvailabilityCalendarProps {
  providerId: string;
  blockedDates: string[]; // YYYY-MM-DD
  whatsapp?: string | null;
  phone?: string | null;
  initialSelectedDate?: string | null;
}

export function ProviderAvailabilityCalendar({
  providerId,
  blockedDates,
  whatsapp,
  phone,
  initialSelectedDate = null,
}: ProviderAvailabilityCalendarProps) {
  const router = useRouter();
  const todayStr = React.useMemo(() => getCairoTodayString(), []);
  const maxDateStr = React.useMemo(() => addMonthsToDateString(todayStr, 12), [todayStr]);

  const blockedSet = React.useMemo(() => new Set(blockedDates), [blockedDates]);

  // Selected date
  const [selectedDate, setSelectedDate] = React.useState<string | null>(initialSelectedDate);
  const [isPending, startTransition] = React.useTransition();

  // Active month navigation (0 = current month, up to 11)
  const startParsed = React.useMemo(() => parseDateString(todayStr)!, [todayStr]);
  const [monthOffset, setMonthOffset] = React.useState(0);

  const currentYear = Math.floor((startParsed.year * 12 + (startParsed.month - 1) + monthOffset) / 12);
  const currentMonth = ((startParsed.month - 1 + monthOffset) % 12) + 1; // 1-12

  const canGoPrev = monthOffset > 0;
  const canGoNext = monthOffset < 11;

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    startTransition(async () => {
      try {
        await setWeddingDate(dateStr);
        router.refresh();
      } catch (err) {
        console.error("Failed to set wedding date:", err);
      }
    });
  };

  const handleWhatsAppClick = () => {
    trackContactClick(providerId, "whatsapp");
  };

  // Calendar cells
  const leadingOffset = getFirstWeekdayOffsetSaturdayStart(currentYear, currentMonth);
  const totalDays = daysInMonth(currentYear, currentMonth);

  const isSelectedDateBlocked = selectedDate ? blockedSet.has(selectedDate) : false;
  const whatsappUrl = selectedDate
    ? buildWhatsAppUrl({ whatsapp, phone, date: selectedDate })
    : buildWhatsAppUrl({ whatsapp, phone });

  return (
    <div className="flex flex-col gap-6 rounded-[8px] border border-border bg-surface-raised p-5 sm:p-6">
      {/* Month Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setMonthOffset((m) => Math.max(0, m - 1))}
          disabled={!canGoPrev}
          aria-label="الشهر السابق"
          className="h-11 w-11 min-h-[44px] min-w-[44px]"
        >
          <CaretRight className="h-4 w-4" weight="bold" />
        </Button>

        <span className="font-display font-bold text-base text-text">
          {ARABIC_MONTHS[currentMonth - 1]} {currentYear}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setMonthOffset((m) => Math.min(11, m + 1))}
          disabled={!canGoNext}
          aria-label="الشهر التالي"
          className="h-11 w-11 min-h-[44px] min-w-[44px]"
        >
          <CaretLeft className="h-4 w-4" weight="bold" />
        </Button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {ARABIC_WEEKDAYS_SHORT.map((wd) => (
          <div key={wd} className="text-xs font-semibold text-text-muted py-1">
            {wd}
          </div>
        ))}
      </div>

      {/* Day Cells Grid */}
      <div className="grid grid-cols-7 gap-1.5" role="grid" aria-label="تقويم التوافر">
        {Array.from({ length: leadingOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[44px] min-w-[44px]" aria-hidden="true" />
        ))}

        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1;
          const dateStr = formatYmd(currentYear, currentMonth, day);
          const isPast = dateStr < todayStr;
          const isTooFar = dateStr > maxDateStr;
          const isBlocked = blockedSet.has(dateStr);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;

          const isDisabled = isPast || isTooFar;

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isDisabled}
              onClick={() => handleSelectDate(dateStr)}
              aria-label={`${day} ${ARABIC_MONTHS[currentMonth - 1]} ${currentYear}${
                isBlocked ? " (محجوز)" : " (متاح)"
              }`}
              aria-selected={isSelected}
              className={cn(
                "min-h-[44px] min-w-[44px] flex flex-col items-center justify-center rounded-[4px] font-latin text-sm transition-colors relative",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isDisabled && "text-text-muted/30 opacity-40 cursor-not-allowed",
                !isDisabled && isBlocked && "bg-surface-muted text-text-muted line-through hover:bg-surface-muted/80",
                !isDisabled && !isBlocked && "hover:bg-surface-muted text-text font-medium cursor-pointer",
                isSelected &&
                  "bg-text text-text-inverse font-bold hover:bg-text hover:text-text-inverse line-through-none",
                isToday && !isSelected && "border border-accent-text"
              )}
            >
              <span>{day}</span>
              {isBlocked && !isSelected && (
                <span className="text-[9px] font-body text-danger leading-none">محجوز</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selection Feedback Card */}
      {selectedDate && (
        <div className="mt-2 rounded-[4px] border border-border bg-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isSelectedDateBlocked ? (
              <XCircle className="h-6 w-6 text-danger shrink-0" weight="fill" />
            ) : (
              <CheckCircle className="h-6 w-6 text-success shrink-0" weight="fill" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-text">
                  {formatArabicDateString(selectedDate)}
                </span>
                <Badge
                  variant={isSelectedDateBlocked ? "danger" : "success"}
                  size="sm"
                >
                  {isSelectedDateBlocked ? "محجوز" : "متاح للحجز"}
                </Badge>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {isSelectedDateBlocked
                  ? "الموعد مسجل كمحجوز في جدول مقدم الخدمة، تواصلي معه للتأكد."
                  : "الموعد متاح ومسجل كيوم زفافكِ، تواصلي لتأكيد الحجز."}
              </p>
            </div>
          </div>

          {whatsappUrl && (
            <Button
              asChild
              variant="primary"
              size="sm"
              onClick={handleWhatsAppClick}
              className="gap-2 shrink-0 min-h-[44px]"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <WhatsappLogo className="h-4 w-4" weight="fill" />
                <span>تواصلي لتأكيد الموعد</span>
              </a>
            </Button>
          )}
        </div>
      )}

      {/* Note */}
      <div className="flex items-center gap-2 pt-2 border-t border-border text-xs text-text-muted">
        <Info className="h-4 w-4 text-accent-text shrink-0" />
        <span>
          التوافر بحسب ما سجله مقدم الخدمة، يرجى التواصل معه مباشرة للتأكيد النهائي.
        </span>
      </div>
    </div>
  );
}
