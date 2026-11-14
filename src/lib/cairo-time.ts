import { addMonthsToDateString, parseDateString } from "./calendar-dates";

export const CAIRO_TIMEZONE = "Africa/Cairo";

/**
 * Computes offset in milliseconds between Africa/Cairo local time and UTC for a given timestamp.
 * Fully accounts for Egyptian daylight saving time transitions.
 */
function getCairoOffsetMs(utcDate: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CAIRO_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }).formatToParts(utcDate);

  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const h = map.hour === "24" ? 0 : Number(map.hour);
  const cairoAsUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    h,
    Number(map.minute),
    Number(map.second)
  );
  return cairoAsUtc - utcDate.getTime();
}

/**
 * Converts a Date to "YYYY-MM-DD" in the Africa/Cairo timezone.
 */
export function toCairoDateString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CAIRO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

/**
 * Returns a Date object representing 00:00:00.000 in Africa/Cairo for the given "YYYY-MM-DD" string.
 */
export function cairoStartOfDay(dateString: string): Date {
  const parsed = parseDateString(dateString);
  if (!parsed) {
    throw new Error(`Invalid date string: ${dateString}`);
  }

  const targetUtc = Date.UTC(parsed.year, parsed.month - 1, parsed.day, 0, 0, 0);
  const guess = new Date(targetUtc - 2 * 3600000);
  const offset = getCairoOffsetMs(guess);
  let actual = new Date(targetUtc - offset);
  const offset2 = getCairoOffsetMs(actual);
  if (offset2 !== offset) {
    actual = new Date(targetUtc - offset2);
  }
  return actual;
}

/**
 * Pure calendar month addition in Cairo calendar ("YYYY-MM-DD" + n months).
 */
export function addMonthsCairo(dateString: string, n: number): string {
  return addMonthsToDateString(dateString, n);
}

/**
 * Returns whole calendar days remaining until endsAt from a reference date (defaults to now) in Cairo time.
 * If endsAt is midnight tomorrow Cairo time, returns 1.
 * If endsAt <= today's midnight Cairo time, returns <= 0.
 */
export function daysUntil(endsAt: Date, fromDate: Date = new Date()): number {
  const todayStart = cairoStartOfDay(toCairoDateString(fromDate));
  const diffMs = endsAt.getTime() - todayStart.getTime();
  return Math.round(diffMs / (24 * 3600 * 1000));
}

/**
 * A subscription covers WHOLE days.
 * endsAt is exclusive end (00:00 of the day AFTER the last covered day).
 * This helper returns the "YYYY-MM-DD" string of the last covered day (endsAt minus one day).
 */
export function getLastCoveredDateString(endsAt: Date): string {
  return toCairoDateString(new Date(endsAt.getTime() - 12 * 3600000));
}
