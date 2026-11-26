import type { ReviewStatus } from "@prisma/client";
import { z } from "zod";
import { normalizePlainText } from "@/lib/validation";

export const REVIEW_MAX_COMMENT_LENGTH = 1000;
export const REVIEW_MAX_REPLY_LENGTH = 600;
export const REVIEW_REPORT_MAX_REASON_LENGTH = 300;
export const REVIEW_MODERATION_NOTE_MAX_LENGTH = 500;

export const REVIEW_STATUS_LABELS_AR: Record<ReviewStatus, string> = {
  PENDING: "بانتظار المراجعة",
  APPROVED: "منشور",
  REJECTED: "مرفوض",
};

export const reviewInputSchema = z.object({
  rating: z
    .number({ message: "يرجى اختيار التقييم من 1 إلى 5 نجوم" })
    .int("التقييم يجب أن يكون رقماً صحيحاً")
    .min(1, "التقييم يجب أن يكون بين 1 و 5 نجوم")
    .max(5, "التقييم يجب أن يكون بين 1 و 5 نجوم"),
  comment: z
    .string()
    .optional()
    .nullable()
    .transform((val) => {
      if (!val) return null;
      const clean = normalizePlainText(val);
      return clean.length > 0 ? clean : null;
    })
    .refine(
      (val) => !val || val.length <= REVIEW_MAX_COMMENT_LENGTH,
      `التعليق يجب ألا يتجاوز ${REVIEW_MAX_COMMENT_LENGTH} حرفاً`
    ),
});

export const reviewReplySchema = z.object({
  reply: z
    .string()
    .transform((val) => normalizePlainText(val))
    .refine((val) => val.length >= 2, "الرد يجب أن يحتوي على حرفين على الأقل")
    .refine(
      (val) => val.length <= REVIEW_MAX_REPLY_LENGTH,
      `الرد يجب ألا يتجاوز ${REVIEW_MAX_REPLY_LENGTH} حرفاً`
    ),
});

export const reviewReportSchema = z.object({
  reason: z
    .string()
    .transform((val) => normalizePlainText(val))
    .refine((val) => val.length >= 3, "يرجى كتابة سبب البلاغ (3 أحرف على الأقل)")
    .refine(
      (val) => val.length <= REVIEW_REPORT_MAX_REASON_LENGTH,
      `سبب البلاغ يجب ألا تتجاوز ${REVIEW_REPORT_MAX_REASON_LENGTH} حرفاً`
    ),
});
