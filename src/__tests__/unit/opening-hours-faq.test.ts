import { describe, expect, it } from "vitest";
import {
  createDefaultOpeningHours,
  openingHoursSchema,
  toOpeningHoursSpecificationJsonLd,
} from "@/lib/opening-hours";
import {
  faqsSchema,
  highlightsSchema,
  toFaqPageJsonLd,
} from "@/lib/faq-schema";

describe("openingHoursSchema", () => {
  it("accepts a valid weekly schedule and transforms closed days", () => {
    const defaults = createDefaultOpeningHours();
    const parsed = openingHoursSchema.parse(defaults);
    expect(parsed.saturday.isOpen).toBe(true);
    expect(parsed.friday).toEqual({ isOpen: false, open: null, close: null });

    const jsonLd = toOpeningHoursSpecificationJsonLd(parsed);
    expect(jsonLd).toHaveLength(6);
  });

  it("rejects open days where close <= open or invalid format", () => {
    const bad = {
      ...createDefaultOpeningHours(),
      saturday: { isOpen: true, open: "22:00", close: "10:00" },
    };
    expect(openingHoursSchema.safeParse(bad).success).toBe(false);

    const badFormat = {
      ...createDefaultOpeningHours(),
      saturday: { isOpen: true, open: "9am", close: "10:00" },
    };
    expect(openingHoursSchema.safeParse(badFormat).success).toBe(false);
  });
});

describe("faqsSchema and highlightsSchema", () => {
  it("validates FAQs and generates FAQPage JSON-LD", () => {
    const valid = faqsSchema.parse([
      {
        question: "هل متاح الحجز المسبق قبل الفرح بشهر؟",
        answer: "نعم، نتيح الحجز المسبق مع معاينة القاعة وتحديد الباقة المناسبة.",
      },
    ]);
    expect(valid).toHaveLength(1);
    const jsonLd = toFaqPageJsonLd(valid);
    expect(jsonLd?.["@type"]).toBe("FAQPage");
  });

  it("rejects more than 10 FAQs and deduplicates highlights", () => {
    const tooMany = Array.from({ length: 11 }, (_, i) => ({
      question: `سؤال رقم ${i + 1} للتجربة؟`,
      answer: `إجابة كاملة للسؤال رقم ${i + 1}.`,
    }));
    expect(faqsSchema.safeParse(tooMany).success).toBe(false);

    const highlights = highlightsSchema.parse([
      "باركينج خاص",
      "باركينج خاص",
      "قاعة مكيفة",
    ]);
    expect(highlights).toEqual(["باركينج خاص", "قاعة مكيفة"]);
  });
});
