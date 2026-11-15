"use server";

import { cookies } from "next/headers";
import {
  getCairoTodayString,
  addMonthsToDateString,
  parseDateString,
} from "./calendar-dates";

const WEDDING_DATE_COOKIE_NAME = "wedding_date";
const WEDDING_DATE_COOKIE_MAX_AGE = 90 * 24 * 60 * 60; // 90 days in seconds
const MAX_MONTHS_AHEAD = 24;

/**
 * Validates a wedding date string:
 * - Must be valid YYYY-MM-DD format
 * - Cannot be in the past (using Cairo today)
 * - Cannot be more than 24 months ahead
 */
export async function validateWeddingDate(
  dateStr: string
): Promise<{ valid: boolean; error?: string; normalized?: string }> {
  if (!dateStr || typeof dateStr !== "string") {
    return { valid: false, error: "تاريخ غير محدد" };
  }

  const parsed = parseDateString(dateStr);
  if (!parsed) {
    return { valid: false, error: "صيغة التاريخ غير صحيحة" };
  }

  const todayStr = getCairoTodayString();
  if (dateStr < todayStr) {
    return { valid: false, error: "لا يمكن اختيار تاريخ في الماضي" };
  }

  const maxDateStr = addMonthsToDateString(todayStr, MAX_MONTHS_AHEAD);
  if (dateStr > maxDateStr) {
    return { valid: false, error: "لا يمكن اختيار تاريخ بعد أكثر من 24 شهراً" };
  }

  return { valid: true, normalized: dateStr };
}

/**
 * Reads the wedding date cookie from headers.
 */
export async function getWeddingDateFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(WEDDING_DATE_COOKIE_NAME)?.value;
  if (!raw) return null;

  const validation = await validateWeddingDate(raw);
  if (!validation.valid) {
    return null;
  }
  return validation.normalized ?? null;
}

/**
 * Server action to set the wedding date cookie.
 */
export async function setWeddingDate(date: string) {
  const validation = await validateWeddingDate(date);
  if (!validation.valid || !validation.normalized) {
    throw new Error(validation.error || "تاريخ غير صالح");
  }

  const cookieStore = await cookies();
  cookieStore.set(WEDDING_DATE_COOKIE_NAME, validation.normalized, {
    maxAge: WEDDING_DATE_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    httpOnly: false,
  });

  return { success: true, date: validation.normalized };
}

/**
 * Server action to clear the wedding date cookie.
 */
export async function clearWeddingDate() {
  const cookieStore = await cookies();
  cookieStore.delete(WEDDING_DATE_COOKIE_NAME);
  return { success: true };
}
