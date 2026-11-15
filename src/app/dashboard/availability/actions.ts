"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { revalidateProvider } from "@/lib/revalidate";
import {
  addMonthsToDateString,
  dateStringToPrismaDate,
  getCairoTodayString,
  isValidDateString,
  MAX_CALENDAR_MONTHS,
  MAX_DATES_PER_CALL,
} from "@/lib/calendar-dates";
import { prisma } from "@/lib/prisma";
import { requireOwnedProviderAction } from "@/lib/provider-dashboard";

const datesArraySchema = z
  .array(
    z
      .string()
      .trim()
      .refine((val) => isValidDateString(val), {
        message: "صيغة التاريخ غير صالحة",
      })
  )
  .min(1, "يرجى اختيار يوم واحد على الأقل")
  .max(
    MAX_DATES_PER_CALL,
    `لا يمكن تحديد أكثر من ${MAX_DATES_PER_CALL} يوماً في المرة الواحدة`
  );

function validateAndDedupeCairoDates(
  dates: string[]
): { ok: true; dates: string[] } | { ok: false; error: string } {
  const parsed = datesArraySchema.safeParse(dates);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "تواريخ غير صالحة",
    };
  }

  const todayStr = getCairoTodayString();
  const maxDateStr = addMonthsToDateString(todayStr, MAX_CALENDAR_MONTHS);
  const uniqueDates = Array.from(new Set(parsed.data));

  for (const dateStr of uniqueDates) {
    if (dateStr < todayStr || dateStr > maxDateStr) {
      return {
        ok: false,
        error: "يُسمح فقط بالتواريخ من اليوم وحتى 18 شهراً قادمة (بتوقيت القاهرة)",
      };
    }
  }

  return { ok: true, dates: uniqueDates };
}

export async function blockDates(
  dates: string[]
): Promise<{ error?: string; ok?: boolean }> {
  const authResult = await requireOwnedProviderAction();
  if (!authResult.ok) {
    return { error: authResult.error };
  }

  const validated = validateAndDedupeCairoDates(dates);
  if (!validated.ok) {
    return { error: validated.error };
  }

  await prisma.blockedDate.createMany({
    data: validated.dates.map((dateStr) => ({
      providerId: authResult.provider.id,
      date: dateStringToPrismaDate(dateStr),
    })),
    skipDuplicates: true,
  });

  revalidatePath("/dashboard/availability");
  revalidateProvider(authResult.provider.slug, authResult.provider.id);
  return { ok: true };
}

export async function unblockDates(
  dates: string[]
): Promise<{ error?: string; ok?: boolean }> {
  const authResult = await requireOwnedProviderAction();
  if (!authResult.ok) {
    return { error: authResult.error };
  }

  const validated = validateAndDedupeCairoDates(dates);
  if (!validated.ok) {
    return { error: validated.error };
  }

  await prisma.blockedDate.deleteMany({
    where: {
      providerId: authResult.provider.id,
      date: {
        in: validated.dates.map(dateStringToPrismaDate),
      },
    },
  });

  revalidatePath("/dashboard/availability");
  revalidateProvider(authResult.provider.slug, authResult.provider.id);
  return { ok: true };
}

