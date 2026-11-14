"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CaretLeft, CaretRight, CalendarCheck, Check, Warning } from "@phosphor-icons/react";
import {
  ARABIC_MONTHS,
  ARABIC_WEEKDAYS_SHORT,
  daysInMonth,
  expandDateRange,
  formatArabicDateString,
  formatYmd,
  getFirstWeekdayOffsetSaturdayStart,
  MAX_DATES_PER_CALL,
  parseDateString,
} from "@/lib/calendar-dates";
import { blockDates, unblockDates } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

interface MonthOption {
  year: number;
  month: number; // 1-12
  label: string;
}

function buildMonthOptions(todayStr: string, maxDateStr: string): MonthOption[] {
  const start = parseDateString(todayStr);
  const end = parseDateString(maxDateStr);
  if (!start || !end) return [];

  const options: MonthOption[] = [];
  let y = start.year;
  let m = start.month;

  while (y < end.year || (y === end.year && m <= end.month)) {
    options.push({
      year: y,
      month: m,
      label: `${ARABIC_MONTHS[m - 1]} ${y}`,
    });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }

  return options;
}

export function AvailabilityClient({
  initialBlockedDates,
  todayStr,
  maxDateStr,
  isSuspended,
}: {
  initialBlockedDates: string[];
  todayStr: string;
  maxDateStr: string;
  isSuspended: boolean;
}) {
  const router = useRouter();
  const [blockedSet, setBlockedSet] = useState<Set<string>>(
    () => new Set(initialBlockedDates)
  );

  const monthOptions = useMemo(
    () => buildMonthOptions(todayStr, maxDateStr),
    [todayStr, maxDateStr]
  );

  const [monthIndex, setMonthIndex] = useState(0);
  const [mode, setMode] = useState<"single" | "range">("single");
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const currentMonth = monthOptions[monthIndex] ?? monthOptions[0];

  const rangePreviewSet = useMemo(() => {
    if (!rangeStart) return new Set<string>();
    if (!rangeEnd) return new Set<string>([rangeStart]);
    try {
      return new Set(expandDateRange(rangeStart, rangeEnd, MAX_DATES_PER_CALL));
    } catch {
      return new Set<string>([rangeStart, rangeEnd]);
    }
  }, [rangeStart, rangeEnd]);

  const calendarCells = useMemo(() => {
    if (!currentMonth) return [];
    const { year, month } = currentMonth;
    const leadingEmpty = getFirstWeekdayOffsetSaturdayStart(year, month);
    const totalDays = daysInMonth(year, month);

    const cells: Array<{
      key: string;
      day: number | null;
      dateStr: string | null;
    }> = [];

    for (let i = 0; i < leadingEmpty; i++) {
      cells.push({ key: `empty-${i}`, day: null, dateStr: null });
    }
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = formatYmd(year, month, d);
      cells.push({ key: dateStr, day: d, dateStr });
    }
    return cells;
  }, [currentMonth]);

  const handleSingleTap = async (dateStr: string) => {
    if (isSuspended || loading) return;
    setError("");
    setStatusMessage("");

    const isCurrentlyBlocked = blockedSet.has(dateStr);
    setLoading(true);
    const result = isCurrentlyBlocked
      ? await unblockDates([dateStr])
      : await blockDates([dateStr]);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setBlockedSet((prev) => {
      const next = new Set(prev);
      if (isCurrentlyBlocked) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
    setStatusMessage(
      isCurrentlyBlocked
        ? `تم إلغاء حجز يوم ${formatArabicDateString(dateStr)}`
        : `تم تحديد يوم ${formatArabicDateString(dateStr)} كمحجوز`
    );
    router.refresh();
  };

  const handleRangeTap = (dateStr: string) => {
    if (isSuspended || loading) return;
    setError("");
    setStatusMessage("");

    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(dateStr);
      setRangeEnd(null);
      return;
    }

    try {
      expandDateRange(rangeStart, dateStr, MAX_DATES_PER_CALL);
      setRangeEnd(dateStr);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `لا يمكن تحديد أكثر من ${MAX_DATES_PER_CALL} يوماً`
      );
    }
  };

  const handleApplyRange = async (action: "block" | "unblock") => {
    if (isSuspended || loading || !rangeStart) return;
    setError("");
    setStatusMessage("");

    let dates: string[];
    try {
      dates = expandDateRange(
        rangeStart,
        rangeEnd ?? rangeStart,
        MAX_DATES_PER_CALL
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "نطاق التواريخ غير صالح");
      return;
    }

    setLoading(true);
    const result =
      action === "block" ? await blockDates(dates) : await unblockDates(dates);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setBlockedSet((prev) => {
      const next = new Set(prev);
      for (const d of dates) {
        if (action === "block") next.add(d);
        else next.delete(d);
      }
      return next;
    });

    setRangeStart(null);
    setRangeEnd(null);
    setStatusMessage(
      action === "block"
        ? `تم حجز ${dates.length} يوم/أيام بنجاح`
        : `تم إلغاء حجز ${dates.length} يوم/أيام بنجاح`
    );
    router.refresh();
  };

  const upcomingBlockedList = useMemo(
    () =>
      Array.from(blockedSet)
        .filter((d) => d >= todayStr && d <= maxDateStr)
        .sort(),
    [blockedSet, todayStr, maxDateStr]
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>تقويم التوافر والمواعيد</CardTitle>
              <CardDescription>
                حدّدي الأيام المحجوزة أو المتاحة خلال الـ 18 شهراً القادمة (بتوقيت القاهرة).
              </CardDescription>
            </div>

            {/* Mode toggle */}
            <div className="inline-flex rounded-[4px] border border-border bg-surface-muted p-1">
              <button
                type="button"
                disabled={isSuspended}
                onClick={() => {
                  setMode("single");
                  setRangeStart(null);
                  setRangeEnd(null);
                  setError("");
                }}
                className={cn(
                  "min-h-[36px] rounded-[2px] px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  mode === "single"
                    ? "bg-text text-text-inverse font-semibold"
                    : "text-text-muted hover:text-text"
                )}
              >
                تحديد يوم واحد
              </button>
              <button
                type="button"
                disabled={isSuspended}
                onClick={() => {
                  setMode("range");
                  setRangeStart(null);
                  setRangeEnd(null);
                  setError("");
                }}
                className={cn(
                  "min-h-[36px] rounded-[2px] px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  mode === "range"
                    ? "bg-text text-text-inverse font-semibold"
                    : "text-text-muted hover:text-text"
                )}
              >
                تحديد فترة (من - إلى)
              </button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Card */}
      <Card>
        <CardContent className="p-5 sm:p-6">
          {/* Month selector navigation */}
          <div className="flex items-center justify-between gap-2 border-b border-border pb-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={monthIndex <= 0}
              onClick={() => setMonthIndex((i) => Math.max(0, i - 1))}
              className="gap-1"
            >
              <CaretRight className="h-4 w-4" weight="bold" />
              <span>الشهر السابق</span>
            </Button>

            <select
              aria-label="اختيار الشهر"
              value={monthIndex}
              onChange={(e) => setMonthIndex(Number(e.target.value))}
              className="h-10 rounded-[4px] border border-border bg-surface-raised px-4 py-1.5 text-sm font-semibold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {monthOptions.map((opt, idx) => (
                <option key={`${opt.year}-${opt.month}`} value={idx}>
                  {opt.label}
                </option>
              ))}
            </select>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={monthIndex >= monthOptions.length - 1}
              onClick={() =>
                setMonthIndex((i) => Math.min(monthOptions.length - 1, i + 1))
              }
              className="gap-1"
            >
              <span>الشهر التالي</span>
              <CaretLeft className="h-4 w-4" weight="bold" />
            </Button>
          </div>

          {/* Weekday headers starting Saturday */}
          <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-text-muted">
            {ARABIC_WEEKDAYS_SHORT.map((dayName) => (
              <div key={dayName} className="py-1">
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="mt-2 grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell) => {
              if (!cell.day || !cell.dateStr) {
                return <div key={cell.key} className="h-11 min-h-[44px]" />;
              }

              const dateStr = cell.dateStr;
              const isOutOfRange = dateStr < todayStr || dateStr > maxDateStr;
              const isBooked = blockedSet.has(dateStr);
              const isInRange = rangePreviewSet.has(dateStr);
              const isToday = dateStr === todayStr;

              // Specifications:
              // Booked days: clearly distinguished (solid ink with ivory text)
              // Today: thin ring
              // Past days: muted
              // 44px comfortable touch target
              let cellClass =
                "border-border bg-surface-raised text-text hover:border-border-strong hover:bg-surface-muted";

              if (isOutOfRange) {
                cellClass =
                  "border-border/30 bg-surface-muted/40 text-text-muted/40 cursor-not-allowed";
              } else if (isInRange) {
                cellClass =
                  "border-accent bg-accent/20 text-text font-bold";
              } else if (isBooked) {
                cellClass =
                  "border-text bg-text text-text-inverse font-semibold hover:opacity-90";
              }

              return (
                <button
                  key={cell.key}
                  type="button"
                  disabled={isOutOfRange || isSuspended || loading}
                  onClick={() =>
                    mode === "single"
                      ? handleSingleTap(dateStr)
                      : handleRangeTap(dateStr)
                  }
                  aria-pressed={isBooked}
                  aria-label={`${formatArabicDateString(dateStr)}${isBooked ? " - محجوز" : ""}`}
                  className={cn(
                    "relative flex h-11 min-h-[44px] flex-col items-center justify-center rounded-[4px] border text-sm transition-colors cursor-pointer disabled:cursor-not-allowed select-none",
                    cellClass,
                    isToday && "ring-2 ring-ring ring-offset-2 ring-offset-surface"
                  )}
                >
                  <span className="font-latin text-xs leading-none">{cell.day}</span>
                  {isBooked && !isOutOfRange && (
                    <span className="text-[9px] leading-none mt-1 opacity-90">
                      محجوز
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-border pt-4 text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3.5 w-3.5 rounded-[2px] border border-border bg-surface-raised" />
              <span>متاح للحجز</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3.5 w-3.5 rounded-[2px] border border-text bg-text text-text-inverse" />
              <span className="font-semibold text-text">محجوز (حبر مصمت)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3.5 w-3.5 rounded-[2px] border border-border/40 bg-surface-muted/40" />
              <span>خارج النطاق المسموح</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3.5 w-3.5 rounded-[2px] ring-2 ring-ring" />
              <span>اليوم الحالي</span>
            </div>
          </div>

          {/* Range action bar */}
          {mode === "range" && rangeStart && !isSuspended && (
            <div className="mt-6 rounded-[4px] border border-accent/40 bg-accent/10 p-4 space-y-3">
              <p className="text-xs font-medium text-text">
                {rangeEnd
                  ? `الفترة المحددة: من ${formatArabicDateString(
                      rangeStart <= rangeEnd ? rangeStart : rangeEnd
                    )} إلى ${formatArabicDateString(
                      rangeStart <= rangeEnd ? rangeEnd : rangeStart
                    )} (${rangePreviewSet.size} يوم)`
                  : `تاريخ البداية: ${formatArabicDateString(rangeStart)} — اضغطي على تاريخ النهاية لتأكيد الفترة`}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  loading={loading}
                  onClick={() => handleApplyRange("block")}
                >
                  حجز الفترة المحددة
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={loading}
                  onClick={() => handleApplyRange("unblock")}
                >
                  إلغاء حجز الفترة
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={loading}
                  onClick={() => {
                    setRangeStart(null);
                    setRangeEnd(null);
                  }}
                >
                  مسح التحديد
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-[4px] border border-danger/30 bg-danger-muted p-3 text-xs text-danger">
              {error}
            </div>
          )}

          {statusMessage && (
            <div className="mt-4 rounded-[4px] border border-success/30 bg-success-muted p-3 text-xs text-success">
              {statusMessage}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Blocked Dates Card */}
      <Card>
        <CardHeader>
          <CardTitle>الأيام المحجوزة القادمة ({upcomingBlockedList.length})</CardTitle>
          <CardDescription>قائمة المواعيد المحجوزة المسجلة حالياً في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingBlockedList.length === 0 ? (
            <p className="text-xs text-text-muted">
              لا توجد أيام محجوزة حالياً، كافة الأيام متاحة للحجز.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {upcomingBlockedList.slice(0, 30).map((d) => (
                <Badge
                  key={d}
                  variant="neutral"
                  className="font-latin text-xs"
                >
                  {formatArabicDateString(d)}
                </Badge>
              ))}
              {upcomingBlockedList.length > 30 && (
                <span className="px-2 py-1 text-xs text-text-muted font-latin">
                  و {upcomingBlockedList.length - 30} يوماً آخر...
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
