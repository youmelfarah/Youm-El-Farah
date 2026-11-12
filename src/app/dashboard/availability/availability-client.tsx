"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h1 className="text-lg font-bold text-gray-900">تقويم التوافر والمواعيد</h1>
        <p className="mt-1 text-xs text-gray-500">
          حدّد الأيام المحجوزة أو غير المتاحة خلال الـ 18 شهراً القادمة (بتوقيت القاهرة).
        </p>

        {/* Mode toggle */}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={isSuspended}
            onClick={() => {
              setMode("single");
              setRangeStart(null);
              setRangeEnd(null);
              setError("");
            }}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              mode === "single"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-300 bg-white text-gray-700"
            }`}
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
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              mode === "range"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-300 bg-white text-gray-700"
            }`}
          >
            تحديد فترة (من - إلى)
          </button>
        </div>

        <p className="mt-2 text-xs text-gray-600">
          {mode === "single"
            ? "اضغط على أي يوم متاح لحجزه، أو اضغط على يوم محجوز لإلغاء الحجز."
            : "اضغط على يوم البداية ثم يوم النهاية، وبعدها اختر حجز الفترة أو إلغاء الحجز."}
        </p>
      </div>

      {/* Month selector */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={monthIndex <= 0}
            onClick={() => setMonthIndex((i) => Math.max(0, i - 1))}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            الشهر السابق
          </button>

          <select
            aria-label="اختيار الشهر"
            value={monthIndex}
            onChange={(e) => setMonthIndex(Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-bold text-gray-900"
          >
            {monthOptions.map((opt, idx) => (
              <option key={`${opt.year}-${opt.month}`} value={idx}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={monthIndex >= monthOptions.length - 1}
            onClick={() =>
              setMonthIndex((i) => Math.min(monthOptions.length - 1, i + 1))
            }
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            الشهر التالي
          </button>
        </div>

        {/* Weekday headers starting Saturday */}
        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500">
          {ARABIC_WEEKDAYS_SHORT.map((dayName) => (
            <div key={dayName} className="py-1">
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="mt-1 grid grid-cols-7 gap-1">
          {calendarCells.map((cell) => {
            if (!cell.day || !cell.dateStr) {
              return <div key={cell.key} className="h-11" />;
            }

            const dateStr = cell.dateStr;
            const isOutOfRange = dateStr < todayStr || dateStr > maxDateStr;
            const isBooked = blockedSet.has(dateStr);
            const isInRange = rangePreviewSet.has(dateStr);
            const isToday = dateStr === todayStr;

            let cellClass =
              "border-gray-200 bg-white text-gray-900 hover:bg-gray-50";
            if (isOutOfRange) {
              cellClass =
                "border-gray-100 bg-gray-100 text-gray-300 cursor-not-allowed";
            } else if (isInRange) {
              cellClass =
                "border-blue-600 bg-blue-100 text-blue-900 font-bold";
            } else if (isBooked) {
              cellClass =
                "border-red-300 bg-red-100 text-red-900 font-bold hover:bg-red-200";
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
                className={`relative flex h-11 flex-col items-center justify-center rounded-lg border text-sm transition disabled:cursor-not-allowed ${cellClass} ${
                  isToday ? "ring-2 ring-blue-500 ring-offset-1" : ""
                }`}
              >
                <span>{cell.day}</span>
                {isBooked && !isOutOfRange && (
                  <span className="text-[9px] leading-none text-red-700">
                    محجوز
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-3 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded border border-gray-300 bg-white" />
            <span>متاح</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded border border-red-300 bg-red-100" />
            <span>محجوز / غير متاح</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded border border-gray-200 bg-gray-100" />
            <span>خارج النطاق المسموح</span>
          </div>
        </div>

        {/* Range action bar */}
        {mode === "range" && rangeStart && !isSuspended && (
          <div className="mt-4 space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs font-medium text-blue-900">
              {rangeEnd
                ? `الفترة المحددة: من ${formatArabicDateString(
                    rangeStart <= rangeEnd ? rangeStart : rangeEnd
                  )} إلى ${formatArabicDateString(
                    rangeStart <= rangeEnd ? rangeEnd : rangeStart
                  )} (${rangePreviewSet.size} يوم)`
                : `تاريخ البداية: ${formatArabicDateString(rangeStart)} — اضغط على تاريخ النهاية أو نفّذ على هذا اليوم`}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleApplyRange("block")}
                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "جارٍ التنفيذ..." : "حجز الفترة المحددة"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleApplyRange("unblock")}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
              >
                إلغاء حجز الفترة
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setRangeStart(null);
                  setRangeEnd(null);
                }}
                className="rounded-lg px-2 py-2 text-xs text-gray-600 hover:underline"
              >
                مسح التحديد
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {statusMessage && (
          <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {statusMessage}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900">
          الأيام المحجوزة القادمة ({upcomingBlockedList.length})
        </h2>
        {upcomingBlockedList.length === 0 ? (
          <p className="mt-2 text-xs text-gray-500">
            لا توجد أيام محجوزة حالياً.
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {upcomingBlockedList.slice(0, 30).map((d) => (
              <span
                key={d}
                className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs text-red-800"
              >
                {formatArabicDateString(d)}
              </span>
            ))}
            {upcomingBlockedList.length > 30 && (
              <span className="px-2 py-1 text-xs text-gray-500">
                و {upcomingBlockedList.length - 30} يوماً آخر...
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

