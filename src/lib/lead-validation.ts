import type { LeadStatus } from "@prisma/client";
import { z } from "zod";
import { getCairoTodayString, isValidDateString } from "@/lib/calendar-dates";
import { normalizeEgyptianPhone, normalizePlainText } from "@/lib/validation";

export const LEAD_MAX_NAME_LENGTH = 100;
export const LEAD_MAX_MESSAGE_LENGTH = 500;
export const LEAD_MAX_NOTE_LENGTH = 1000;

export const LEAD_STATUS_VALUES = [
  "NEW",
  "CONTACTED",
  "BOOKED",
  "DECLINED",
  "SPAM",
] as const;

export const LEAD_STATUS_LABELS_AR: Record<LeadStatus, string> = {
  NEW: "جديد",
  CONTACTED: "تم التواصل",
  BOOKED: "تم الحجز",
  DECLINED: "لم يتم الاتفاق",
  SPAM: "مزعج",
};

/**
 * Builds the lead submission zod schema with injectable Cairo today date for deterministic testing.
 */
export function createLeadSchema(todayCairoStr?: string) {
  const minDate = todayCairoStr ?? getCairoTodayString();

  return z.object({
    providerId: z.string().trim().min(1, "مقدم الخدمة غير محدد"),
    name: z
      .string()
      .transform((val) => normalizePlainText(val))
      .refine((val) => val.length >= 2, "الاسم مطلوب (حرفان على الأقل)")
      .refine(
        (val) => val.length <= LEAD_MAX_NAME_LENGTH,
        `الاسم يجب ألا يتجاوز ${LEAD_MAX_NAME_LENGTH} حرفاً`
      ),
    phone: z
      .string()
      .trim()
      .transform((val, ctx) => {
        if (!val) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "رقم الموبايل مطلوب",
          });
          return z.NEVER;
        }
        const normalized = normalizeEgyptianPhone(val);
        if (!normalized) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "رقم الهاتف غير صحيح. أدخل رقم موبايل مصري يبدأ بـ 01 أو +20 (مثل 01012345678)",
          });
          return z.NEVER;
        }
        return normalized;
      }),
    weddingDate: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform((val, ctx) => {
        if (!val) return null;
        if (!isValidDateString(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "صيغة تاريخ الفرح غير صحيحة",
          });
          return z.NEVER;
        }
        if (val < minDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "تاريخ الفرح لا يمكن أن يكون في الماضي",
          });
          return z.NEVER;
        }
        return val;
      }),
    offerId: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null)),
    message: z
      .string()
      .optional()
      .nullable()
      .transform((val) => {
        if (!val) return null;
        const clean = normalizePlainText(val);
        return clean.length > 0 ? clean : null;
      })
      .refine(
        (val) => !val || val.length <= LEAD_MAX_MESSAGE_LENGTH,
        `الرسالة يجب ألا تتجاوز ${LEAD_MAX_MESSAGE_LENGTH} حرفاً`
      ),
    website: z
      .string()
      .optional()
      .default("")
      .refine((val) => val.trim() === "", "طلب غير صالح"),
  });
}

export const updateLeadStatusSchema = z.object({
  leadId: z.string().trim().min(1, "الطلب غير محدد"),
  status: z.enum(LEAD_STATUS_VALUES, {
    message: "حالة الطلب غير صالحة",
  }),
  providerNote: z
    .string()
    .optional()
    .nullable()
    .transform((val) => {
      if (!val) return null;
      const clean = normalizePlainText(val);
      return clean.length > 0 ? clean : null;
    })
    .refine(
      (val) => !val || val.length <= LEAD_MAX_NOTE_LENGTH,
      `الملاحظة يجب ألا تتجاوز ${LEAD_MAX_NOTE_LENGTH} حرفاً`
    ),
});
