import { z } from "zod";

export const WEEKDAY_KEYS = [
  "saturday",
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
] as const;

export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export const WEEKDAY_LABELS_AR: Record<WeekdayKey, string> = {
  saturday: "السبت",
  sunday: "الأحد",
  monday: "الإثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
};

export const WEEKDAY_SCHEMA_ORG: Record<WeekdayKey, string> = {
  saturday: "https://schema.org/Saturday",
  sunday: "https://schema.org/Sunday",
  monday: "https://schema.org/Monday",
  tuesday: "https://schema.org/Tuesday",
  wednesday: "https://schema.org/Wednesday",
  thursday: "https://schema.org/Thursday",
  friday: "https://schema.org/Friday",
};

const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const dayOpeningHoursSchema = z
  .object({
    isOpen: z.boolean(),
    open: z.string().trim().optional().nullable(),
    close: z.string().trim().optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (!val.isOpen) return;
    if (!val.open || !TIME_24H_REGEX.test(val.open)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["open"],
        message: "يرجى إدخال وقت الفتح بصيغة صحيحة (HH:MM)",
      });
    }
    if (!val.close || !TIME_24H_REGEX.test(val.close)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["close"],
        message: "يرجى إدخال وقت الإغلاق بصيغة صحيحة (HH:MM)",
      });
    }
    if (
      val.open &&
      val.close &&
      TIME_24H_REGEX.test(val.open) &&
      TIME_24H_REGEX.test(val.close) &&
      val.open >= val.close
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["close"],
        message: "وقت الإغلاق يجب أن يكون بعد وقت الفتح",
      });
    }
  })
  .transform((val) =>
    val.isOpen
      ? { isOpen: true as const, open: val.open!, close: val.close! }
      : { isOpen: false as const, open: null, close: null }
  );

export const openingHoursSchema = z.object({
  saturday: dayOpeningHoursSchema,
  sunday: dayOpeningHoursSchema,
  monday: dayOpeningHoursSchema,
  tuesday: dayOpeningHoursSchema,
  wednesday: dayOpeningHoursSchema,
  thursday: dayOpeningHoursSchema,
  friday: dayOpeningHoursSchema,
});

export type DayOpeningHours = z.infer<typeof dayOpeningHoursSchema>;
export type OpeningHours = z.infer<typeof openingHoursSchema>;

export function createDefaultOpeningHours(): OpeningHours {
  return {
    saturday: { isOpen: true, open: "10:00", close: "22:00" },
    sunday: { isOpen: true, open: "10:00", close: "22:00" },
    monday: { isOpen: true, open: "10:00", close: "22:00" },
    tuesday: { isOpen: true, open: "10:00", close: "22:00" },
    wednesday: { isOpen: true, open: "10:00", close: "22:00" },
    thursday: { isOpen: true, open: "10:00", close: "22:00" },
    friday: { isOpen: false, open: null, close: null },
  };
}

export function parseOpeningHours(raw: unknown): OpeningHours | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = openingHoursSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function formatTime24ToArabic12(time24: string): string {
  const match = TIME_24H_REGEX.exec(time24);
  if (!match) return time24;
  const hour24 = Number(match[1]);
  const minute = match[2];
  const period = hour24 >= 12 ? "م" : "ص";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute} ${period}`;
}

export function toOpeningHoursSpecificationJsonLd(
  hours: OpeningHours | null
): Array<Record<string, unknown>> {
  if (!hours) return [];
  const specs: Array<Record<string, unknown>> = [];
  for (const day of WEEKDAY_KEYS) {
    const entry = hours[day];
    if (entry.isOpen && entry.open && entry.close) {
      specs.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: WEEKDAY_SCHEMA_ORG[day],
        opens: entry.open,
        closes: entry.close,
      });
    }
  }
  return specs;
}
