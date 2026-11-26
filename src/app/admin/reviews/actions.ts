"use server";

import { revalidatePath } from "next/cache";
import { AuthError, requireRoleAction } from "@/lib/auth-helpers";
import { logAuditEntry } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import {
  REVIEW_MODERATION_NOTE_MAX_LENGTH,
  recomputeProviderRatingAggregates,
} from "@/lib/review-aggregates";
import { revalidateProvider } from "@/lib/revalidate";
import { normalizePlainText } from "@/lib/validation";

async function requireAdminId(): Promise<
  { ok: true; adminId: string } | { ok: false; error: string }
> {
  try {
    const session = await requireRoleAction("ADMIN");
    return { ok: true, adminId: session.user.id };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message };
    }
    return { ok: false, error: "غير مصرح لك بهذا الإجراء" };
  }
}

export async function moderateReviewAction(input: {
  reviewId: string;
  decision: "APPROVED" | "REJECTED";
  moderationNote?: string | null;
}): Promise<{ ok?: boolean; error?: string }> {
  const admin = await requireAdminId();
  if (!admin.ok) return { error: admin.error };

  const cleanNote = input.moderationNote
    ? normalizePlainText(input.moderationNote)
    : null;
  if (cleanNote && cleanNote.length > REVIEW_MODERATION_NOTE_MAX_LENGTH) {
    return {
      error: `ملاحظة المراجعة يجب ألا تتجاوز ${REVIEW_MODERATION_NOTE_MAX_LENGTH} حرفاً`,
    };
  }

  if (input.decision === "REJECTED" && (!cleanNote || cleanNote.length < 3)) {
    return { error: "يرجى كتابة سبب الرفض أو الإخفاء (3 أحرف على الأقل)" };
  }

  const review = await prisma.review.findUnique({
    where: { id: input.reviewId },
    select: {
      id: true,
      providerId: true,
      status: true,
      provider: { select: { slug: true } },
    },
  });

  if (!review) {
    return { error: "التقييم غير موجود" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.review.update({
        where: { id: review.id },
        data: {
          status: input.decision,
          moderationNote: cleanNote,
          moderatedAt: new Date(),
          moderatedById: admin.adminId,
        },
      });

      const aggregates = await recomputeProviderRatingAggregates(
        tx,
        review.providerId
      );

      await logAuditEntry(tx, {
        adminId: admin.adminId,
        action:
          input.decision === "APPROVED" ? "review.approve" : "review.reject",
        entityType: "Review",
        entityId: review.id,
        providerId: review.providerId,
        details: {
          beforeStatus: review.status,
          afterStatus: input.decision,
          moderationNote: cleanNote,
          aggregates,
        },
      });
    });
  } catch {
    return { error: "تعذر تحديث حالة التقييم" };
  }

  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  revalidatePath("/dashboard/reviews");
  revalidatePath("/account/reviews");
  revalidateProvider(review.provider.slug, review.providerId);
  return { ok: true };
}

export async function toggleProviderReplyHiddenAction(input: {
  reviewId: string;
  hidden: boolean;
}): Promise<{ ok?: boolean; error?: string }> {
  const admin = await requireAdminId();
  if (!admin.ok) return { error: admin.error };

  const review = await prisma.review.findUnique({
    where: { id: input.reviewId },
    select: {
      id: true,
      providerId: true,
      providerReplyHidden: true,
      provider: { select: { slug: true } },
    },
  });

  if (!review) {
    return { error: "التقييم غير موجود" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.review.update({
        where: { id: review.id },
        data: { providerReplyHidden: input.hidden },
      });

      await logAuditEntry(tx, {
        adminId: admin.adminId,
        action: input.hidden ? "review.reply_hide" : "review.reply_unhide",
        entityType: "Review",
        entityId: review.id,
        providerId: review.providerId,
        details: {
          before: { providerReplyHidden: review.providerReplyHidden },
          after: { providerReplyHidden: input.hidden },
        },
      });
    });
  } catch {
    return { error: "تعذر تحديث حالة رد مقدم الخدمة" };
  }

  revalidatePath("/admin/reviews");
  revalidatePath("/dashboard/reviews");
  revalidateProvider(review.provider.slug, review.providerId);
  return { ok: true };
}

export async function resolveReviewReportAction(input: {
  reportId: string;
  mode: "DISMISS" | "REJECT_REVIEW" | "HIDE_REPLY";
  note?: string | null;
}): Promise<{ ok?: boolean; error?: string }> {
  const admin = await requireAdminId();
  if (!admin.ok) return { error: admin.error };

  const cleanNote = input.note ? normalizePlainText(input.note) : null;
  if (input.mode === "REJECT_REVIEW" && (!cleanNote || cleanNote.length < 3)) {
    return { error: "يرجى كتابة سبب رفض التقييم (3 أحرف على الأقل)" };
  }

  const report = await prisma.reviewReport.findUnique({
    where: { id: input.reportId },
    select: {
      id: true,
      reviewId: true,
      resolvedAt: true,
      review: {
        select: {
          id: true,
          providerId: true,
          status: true,
          provider: { select: { slug: true } },
        },
      },
    },
  });

  if (!report) {
    return { error: "البلاغ غير موجود" };
  }

  if (report.resolvedAt) {
    return { error: "تمت معالجة هذا البلاغ مسبقاً" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const now = new Date();
      await tx.reviewReport.update({
        where: { id: report.id },
        data: {
          resolvedAt: now,
          resolvedById: admin.adminId,
        },
      });

      if (input.mode === "REJECT_REVIEW") {
        await tx.review.update({
          where: { id: report.reviewId },
          data: {
            status: "REJECTED",
            moderationNote: cleanNote,
            moderatedAt: now,
            moderatedById: admin.adminId,
          },
        });
        await recomputeProviderRatingAggregates(tx, report.review.providerId);
      } else if (input.mode === "HIDE_REPLY") {
        await tx.review.update({
          where: { id: report.reviewId },
          data: { providerReplyHidden: true },
        });
      }

      await logAuditEntry(tx, {
        adminId: admin.adminId,
        action: "review_report.resolve",
        entityType: "ReviewReport",
        entityId: report.id,
        providerId: report.review.providerId,
        details: {
          reviewId: report.reviewId,
          mode: input.mode,
          note: cleanNote,
        },
      });
    });
  } catch {
    return { error: "تعذر معالجة البلاغ" };
  }

  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  revalidatePath("/dashboard/reviews");
  revalidatePath("/account/reviews");
  revalidateProvider(report.review.provider.slug, report.review.providerId);
  return { ok: true };
}
