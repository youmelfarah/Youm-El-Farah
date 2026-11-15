"use client";

import * as React from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import {
  ARABIC_MONTHS,
  ARABIC_WEEKDAYS_SHORT,
  daysInMonth,
  formatYmd,
  getFirstWeekdayOffsetSaturdayStart,
  parseDateString,
  getCairoTodayString,
  addMonthsToDateString,
} from "@/lib/calendar-dates";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export interface WeddingDateCalendarProps {
  selectedDate?: string | null;
  onSelectDate: (date: string) => void;
  className?: string;
}

export function WeddingDateCalendar({
  selectedDate,
  onSelectDate,
  className,
}: WeddingDateCalendarProps) {
  const todayStr = React.useMemo(() => getCairoTodayString(), []);
  const maxDateStr = React.useMemo(() => addMonthsToDateString(todayStr, 24), [todayStr]);

  const initialParsed = React.useMemo(() => {
    if (selectedDate) {
      const p = parseDateString(selectedDate);
      if (p) return p;
    }
    return parseDateString(todayStr) || { year: 2026, month: 11, day: 15 };
  }, [selectedDate, todayStr]);

  const [currentYear, setCurrentYear] = React.useState(initialParsed.year);
  const [currentMonth, setCurrentMonth] = React.useState(initialParsed.month); // 1-12

  // Boundaries
  const startParsed = parseDateString(todayStr)!;
  const maxParsed = parseDateString(maxDateStr)!;

  const canGoPrev =
    currentYear > startParsed.year ||
    (currentYear === startParsed.year && currentMonth > startParsed.month);

  const canGoNext =
    currentYear < maxParsed.year ||
    (currentYear === maxParsed.year && currentMonth < maxParsed.month);

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (!canGoNext) return;
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Build grid
  const leadingOffset = getFirstWeekdayOffsetSaturdayStart(currentYear, currentMonth);
  const totalDays = daysInMonth(currentYear, currentMonth);

  const cells = React.useMemo(() => {
    const list: Array<{ day: number; dateStr: string; disabled: boolean; isToday: boolean; isSelected: boolean }> = [];
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = formatYmd(currentYear, currentMonth, d);
      const disabled = dateStr < todayStr || dateStr > maxDateStr;
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDate;
      list.push({ day: d, dateStr, disabled, isToday, isSelected });
    }
    return list;
  }, [currentYear, currentMonth, totalDays, todayStr, maxDateStr, selectedDate]);

  return (
    <div className={cn("w-full max-w-[340px] select-none", className)}>
      {/* Month Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        {/* In RTL: Right caret points to previous month */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handlePrevMonth}
          disabled={!canGoPrev}
          aria-label="الشهر السابق"
          className="h-11 w-11 min-h-[44px] min-w-[44px]"
        >
          <CaretRight className="h-4 w-4" weight="bold" />
        </Button>

        <span className="font-display font-bold text-sm text-text">
          {ARABIC_MONTHS[currentMonth - 1]} {currentYear}
        </span>

        {/* In RTL: Left caret points to next month */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          disabled={!canGoNext}
          aria-label="الشهر التالي"
          className="h-11 w-11 min-h-[44px] min-w-[44px]"
        >
          <CaretLeft className="h-4 w-4" weight="bold" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 pt-3 pb-1 text-center">
        {ARABIC_WEEKDAYS_SHORT.map((wd) => (
          <div
            key={wd}
            className="text-[11px] font-semibold text-text-muted py-1 flex items-center justify-center"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Day cells grid */}
      <div className="grid grid-cols-7 gap-1 pt-1" role="grid" aria-label="تقويم تحديد يوم الفرح">
        {Array.from({ length: leadingOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[44px] min-w-[44px]" aria-hidden="true" />
        ))}

        {cells.map((cell) => (
          <button
            key={cell.dateStr}
            type="button"
            disabled={cell.disabled}
            onClick={() => onSelectDate(cell.dateStr)}
            aria-label={`${cell.day} ${ARABIC_MONTHS[currentMonth - 1]} ${currentYear}`}
            aria-selected={cell.isSelected}
            className={cn(
              "min-h-[44px] min-w-[44px] flex flex-col items-center justify-center rounded-[4px] font-latin text-sm transition-colors relative",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              cell.disabled
                ? "text-text-muted/40 opacity-40 cursor-not-allowed"
                : "cursor-pointer hover:bg-surface-muted text-text",
              cell.isSelected &&
                "bg-text text-text-inverse font-bold hover:bg-text hover:text-text-inverse",
              cell.isToday && !cell.isSelected && "border border-accent-text font-bold"
            )}
          >
            <span>{cell.day}</span>
            {cell.isToday && !cell.isSelected && (
              <span className="w-1 h-1 rounded-full bg-accent-text mt-0.5" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
