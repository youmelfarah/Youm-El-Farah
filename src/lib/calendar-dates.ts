export const CAIRO_TIMEZONE = "Africa/Cairo";
export const MAX_CALENDAR_MONTHS = 18;
export const MAX_DATES_PER_CALL = 366;

export const ARABIC_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
] as const;

/** Week starts Saturday (السبت) */
export const ARABIC_WEEKDAYS_SHORT = [
  "سبت",
  "أحد",
  "إثنين",
  "ثلاثاء",
  "أربعاء",
  "خميس",
  "جمعة",
] as const;

const DATE_STRING_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

export function daysInMonth(year: number, month1To12: number): number {
  return new Date(Date.UTC(year, month1To12, 0)).getUTCDate();
}

export function formatYmd(year: number, month1To12: number, day: number): string {
  const y = String(year).padStart(4, "0");
  const m = String(month1To12).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateString(
  dateStr: string
): { year: number; month: number; day: number } | null {
  const match = DATE_STRING_REGEX.exec(dateStr);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1) return null;
  if (day > daysInMonth(year, month)) return null;

  return { year, month, day };
}

export function isValidDateString(dateStr: string): boolean {
  return parseDateString(dateStr) !== null;
}

/**
 * Returns today's calendar date in Africa/Cairo as "YYYY-MM-DD".
 */
export function getCairoTodayString(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CAIRO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);

  return formatYmd(year, month, day);
}

/**
 * Pure calendar month addition on "YYYY-MM-DD" without local timezone conversion.
 */
export function addMonthsToDateString(dateStr: string, monthsToAdd: number): string {
  const parsed = parseDateString(dateStr);
  if (!parsed) {
    throw new Error(`Invalid date string: ${dateStr}`);
  }

  const totalMonths = parsed.year * 12 + (parsed.month - 1) + monthsToAdd;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;
  const maxDay = daysInMonth(targetYear, targetMonth);
  const targetDay = Math.min(parsed.day, maxDay);

  return formatYmd(targetYear, targetMonth, targetDay);
}

/**
 * Converts a validated "YYYY-MM-DD" calendar string into a UTC midnight Date
 * matching @prisma/adapter-pg's DATE serialization (which reads getUTC* fields).
 */
export function dateStringToPrismaDate(dateStr: string): Date {
  const parsed = parseDateString(dateStr);
  if (!parsed) {
    throw new Error(`Invalid date string: ${dateStr}`);
  }
  return new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
}

/**
 * Reads a Date returned by Prisma for a @db.Date column back into "YYYY-MM-DD"
 * using UTC getters (never local timezone).
 */
export function prismaDateToDateString(date: Date): string {
  return formatYmd(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  );
}

/**
 * Adds 1 calendar day to a "YYYY-MM-DD" string using pure UTC calendar math.
 */
export function nextDayString(dateStr: string): string {
  const parsed = parseDateString(dateStr);
  if (!parsed) {
    throw new Error(`Invalid date string: ${dateStr}`);
  }
  const dt = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + 1));
  return prismaDateToDateString(dt);
}

/**
 * Expands an inclusive range [fromStr, toStr] into ordered "YYYY-MM-DD" strings.
 * Automatically swaps if fromStr > toStr. Throws if length exceeds maxDays.
 */
export function expandDateRange(
  fromStr: string,
  toStr: string,
  maxDays: number = MAX_DATES_PER_CALL
): string[] {
  if (!isValidDateString(fromStr) || !isValidDateString(toStr)) {
    throw new Error("تاريخ غير صالح");
  }

  const start = fromStr <= toStr ? fromStr : toStr;
  const end = fromStr <= toStr ? toStr : fromStr;

  const result: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    result.push(cursor);
    if (result.length > maxDays) {
      throw new Error(`لا يمكن تحديد أكثر من ${maxDays} يوماً في المرة الواحدة`);
    }
    cursor = nextDayString(cursor);
  }
  return result;
}

/**
 * Returns the 0-based Saturday-first weekday index (0 = Saturday, 6 = Friday)
 * for the given calendar year & 1-based month.
 */
export function getFirstWeekdayOffsetSaturdayStart(
  year: number,
  month1To12: number
): number {
  const utcDay = new Date(Date.UTC(year, month1To12 - 1, 1)).getUTCDay();
  return (utcDay + 1) % 7;
}

/**
 * Formats "YYYY-MM-DD" in Arabic without timezone shift.
 */
export function formatArabicDateString(dateStr: string): string {
  const parsed = parseDateString(dateStr);
  if (!parsed) return dateStr;
  return `${parsed.day} ${ARABIC_MONTHS[parsed.month - 1]} ${parsed.year}`;
}

