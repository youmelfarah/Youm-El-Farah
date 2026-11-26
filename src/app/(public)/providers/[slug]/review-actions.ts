"use server";

import { revalidatePath } from "next/cache";
import { AuthError, requireRoleAction, requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { visibleProviderWhere } from "@/lib/provider-visibility";
import { RATE_LIMITS, sinceWindowDate } from "@/lib/rate-limit";
import {
  recomputeProviderRatingAggregates,
  reviewInputSchema,
  reviewReportSchema,
} from "@/lib/review-aggregates";
import {
  checkReviewEligibility,
  isPhoneVerificationRequired,
} from "@/lib/review-eligibility";
import { revalidateProvider } from "@/lib/revalidate";

export async function submitReviewAction(input: {
  providerId: string;
  rating: number;
  comment?: string | null;
}): Promise<{
  ok?: boolean;
  error?: string;
  code?: string;
  message?: string;
}> {
  let session;
  try {
    session = await requireRoleAction("VISITOR");
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        error:
          err.code === "UNAUTHENTICATED"
            ? "سجّلي دخولك بجوجل علشان تكملي"
            : "التقييمات متاحة لحسابات الزائرات فقط",
        code: err.code,
      };
    }
    return { error: "يجب تسجيل الدخول أولاً", code: "UNAUTHENTICATED" };
  }

  const parsed = reviewInputSchema.safeParse({
    rating: input.rating,
    comment: input.comment ?? null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات التقييم غير صالحة" };
  }

  const provider = await prisma.provider.findFirst({
    where: {
      id: input.providerId,
      ...visibleProviderWhere(),
    },
    select: {
      id: true,
      slug: true,
      userId: true,
    },
  });

  if (!provider) {
    return { error: "مقدم الخدمة غير متاح حالياً" };
  }

  const [userRecord, existingReview, recentCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, phoneVerifiedAt: true },
    }),
    prisma.review.findUnique({
      where: {
        providerId_userId: {
          providerId: provider.id,
          userId: session.user.id,
        },
      },
      select: { id: true, status: true },
    }),
    prisma.review.count({
      where: {
        userId: session.user.id,
        updatedAt: { gte: sinceWindowDate(RATE_LIMITS.REVIEW_SUBMISSION_24H.windowMs) },
      },
    }),
  ]);

  if (!userRecord) {
    return { error: "تعذر التحقق من حسابك", code: "UNAUTHENTICATED" };
  }

  const isEdit = Boolean(existingReview);
  const eligibility = checkReviewEligibility({
    userId: userRecord.id,
    userRole: userRecord.role,
    providerUserId: provider.userId,
    hasExistingReview: isEdit,
    isEdit,
    recentReviewsCount24h: recentCount,
    phoneVerified: Boolean(userRecord.phoneVerifiedAt),
    phoneVerificationRequired: isPhoneVerificationRequired(),
  });

  if (!eligibility.eligible) {
    return {
      error: eligibility.reason || "لا يمكنك إرسال التقييم حالياً",
      code: eligibility.code,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (existingReview) {
        await tx.review.update({
          where: { id: existingReview.id },
          data: {
            rating: parsed.data.rating,
            comment: parsed.data.comment,
            status: "PENDING",
            moderationNote: null,
            moderatedAt: null,
            moderatedById: null,
          },
        });
        if (existingReview.status === "APPROVED") {
          await recomputeProviderRatingAggregates(tx, provider.id);
        }
      } else {
        await tx.review.create({
          data: {
            providerId: provider.id,
            userId: session.user.id,
            rating: parsed.data.rating,
            comment: parsed.data.comment,
            status: "PENDING",
          },
        });
      }
    });
  } catch {
    return { error: "حدث خطأ أثناء حفظ التقييم" };
  }

  revalidateProvider(provider.slug, provider.id);
  revalidatePath("/account/reviews");
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");

  return {
    ok: true,
    message: "شكراً ليكِ! تقييمك هيظهر بعد المراجعة.",
  };
}

export async function deleteOwnReviewAction(reviewId: string): Promise<{
  ok?: boolean;
  error?: string;
}> {
  let session;
  try {
    session = await requireRoleAction("VISITOR");
  } catch {
    return { error: "يجب تسجيل الدخول بحساب زائرة" };
  }

  if (!reviewId || typeof reviewId !== "string") {
    return { error: "التقييم غير محدد" };
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      userId: true,
      providerId: true,
      status: true,
      provider: { select: { slug: true } },
    },
  });

  if (!review || review.userId !== session.user.id) {
    return { error: "التقييم غير موجود أو لا تملكين صلاحية حذفه" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: review.id } });
      if (review.status === "APPROVED") {
        await recomputeProviderRatingAggregates(tx, review.providerId);
      }
    });
  } catch {
    return { error: "تعذر حذف التقييم" };
  }

  revalidateProvider(review.provider.slug, review.providerId);
  revalidatePath("/account/reviews");
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  return { ok: true };
}

export async function reportReviewAction(input: {
  reviewId: string;
  reason: string;
}): Promise<{
  ok?: boolean;
  error?: string;
  code?: string;
}> {
  let session;
  try {
    session = await requireUser({ isServerAction: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        error: "سجّلي دخولك بجوجل علشان تكملي",
        code: "UNAUTHENTICATED",
      };
    }
    return { error: "يجب تسجيل الدخول أولاً", code: "UNAUTHENTICATED" };
  }

  const parsed = reviewReportSchema.safeParse({ reason: input.reason });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "سبب البلاغ غير صالح" };
  }

  const review = await prisma.review.findUnique({
    where: { id: input.reviewId },
    select: { id: true, userId: true, status: true },
  });

  if (!review || review.status !== "APPROVED") {
    return { error: "التقييم غير موجود" };
  }

  if (review.userId === session.user.id) {
    return { error: "لا يمكنك الإبلاغ عن تقييمك الخاص" };
  }

  const [existingReport, recentReports] = await Promise.all([
    prisma.reviewReport.findUnique({
      where: {
        reviewId_reporterId: {
          reviewId: review.id,
          reporterId: session.user.id,
        },
      },
      select: { id: true },
    }),
    prisma.reviewReport.count({
      where: {
        reporterId: session.user.id,
        createdAt: { gte: sinceWindowDate(RATE_LIMITS.REVIEW_REPORT_24H.windowMs) },
      },
    }),
  ]);

  if (existingReport) {
    return { error: "لقد أبلغتِ عن هذا التقييم مسبقاً" };
  }

  if (recentReports >= RATE_LIMITS.REVIEW_REPORT_24H.max) {
    return {
      error: `وصلتِ للحد الأقصى للبلاغات (${RATE_LIMITS.REVIEW_REPORT_24H.max} بلاغات خلال 24 ساعة)`,
    };
  }

  try {
    await prisma.reviewReport.create({
      data: {
        reviewId: review.id,
        reporterId: session.user.id,
        reason: parsed.data.reason,
      },
    });
  } catch {
    return { error: "تعذر إرسال البلاغ حالياً" };
  }

  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  return { ok: true };
}
