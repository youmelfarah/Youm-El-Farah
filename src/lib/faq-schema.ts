import { z } from "zod";
import { normalizePlainText } from "@/lib/validation";

export const FAQ_MAX_ITEMS = 10;
export const FAQ_MAX_QUESTION_LENGTH = 200;
export const FAQ_MAX_ANSWER_LENGTH = 1000;

export const HIGHLIGHTS_MAX_ITEMS = 8;
export const HIGHLIGHT_MAX_LENGTH = 40;

export const faqItemSchema = z.object({
  question: z
    .string()
    .transform((val) => normalizePlainText(val))
    .refine(
      (val) => val.length >= 5,
      "السؤال يجب أن يحتوي على 5 أحرف على الأقل"
    )
    .refine(
      (val) => val.length <= FAQ_MAX_QUESTION_LENGTH,
      `السؤال يجب ألا يتجاوز ${FAQ_MAX_QUESTION_LENGTH} حرفاً`
    ),
  answer: z
    .string()
    .transform((val) => normalizePlainText(val))
    .refine(
      (val) => val.length >= 5,
      "الإجابة يجب أن تحتوي على 5 أحرف على الأقل"
    )
    .refine(
      (val) => val.length <= FAQ_MAX_ANSWER_LENGTH,
      `الإجابة يجب ألا تتجاوز ${FAQ_MAX_ANSWER_LENGTH} حرفاً`
    ),
});

export const faqsSchema = z
  .array(faqItemSchema)
  .max(FAQ_MAX_ITEMS, `الحد الأقصى للأسئلة الشائعة هو ${FAQ_MAX_ITEMS} أسئلة`);

export type FaqItem = z.infer<typeof faqItemSchema>;

export const highlightsSchema = z
  .array(
    z
      .string()
      .transform((val) => normalizePlainText(val))
      .refine((val) => val.length >= 2, "كل ميزة يجب أن تحتوي على حرفين على الأقل")
      .refine(
        (val) => val.length <= HIGHLIGHT_MAX_LENGTH,
        `الميزة يجب ألا تتجاوز ${HIGHLIGHT_MAX_LENGTH} حرفاً`
      )
  )
  .max(
    HIGHLIGHTS_MAX_ITEMS,
    `الحد الأقصى للمميزات السريعة هو ${HIGHLIGHTS_MAX_ITEMS} مميزات`
  )
  .transform((items) => Array.from(new Set(items)));

export function parseFaqs(raw: unknown): FaqItem[] {
  if (!Array.isArray(raw)) return [];
  const parsed = faqsSchema.safeParse(raw);
  return parsed.success ? parsed.data : [];
}

export function toFaqPageJsonLd(
  faqs: FaqItem[]
): Record<string, unknown> | null {
  if (!faqs || faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
