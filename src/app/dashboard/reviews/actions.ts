"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOwnedProviderAction } from "@/lib/provider-dashboard";
import { reviewReplySchema } from "@/lib/review-aggregates";
import { revalidateProvider } from "@/lib/revalidate";

export async function saveProviderReviewReplyAction(input: {
  reviewId: string;
  reply: string;
}): Promise<{ ok?: boolean; error?: string }> {
  const authResult = await requireOwnedProviderAction();
  if (!authResult.ok) {
    return { error: authResult.error };
  }

  const parsed = reviewReplySchema.safeParse({ reply: input.reply });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "نص الرد غير صالح" };
  }

  const review = await prisma.review.findUnique({
    where: { id: input.reviewId },
    select: { id: true, providerId: true, status: true },
  });

  if (!review || review.providerId !== authResult.provider.id) {
    return { error: "التقييم غير موجود" };
  }

  if (review.status !== "APPROVED") {
    return { error: "لا يمكن الرد إلا على التقييمات المعتمدة والمنشورة" };
  }

  try {
    await prisma.review.update({
      where: { id: review.id },
      data: {
        providerReply: parsed.data.reply,
        providerRepliedAt: new Date(),
      },
    });
  } catch {
    return { error: "تعذر حفظ الرد" };
  }

  revalidatePath("/dashboard/reviews");
  revalidateProvider(authResult.provider.slug, authResult.provider.id);
  return { ok: true };
}

export async function deleteProviderReviewReplyAction(
  reviewId: string
): Promise<{ ok?: boolean; error?: string }> {
  const authResult = await requireOwnedProviderAction();
  if (!authResult.ok) {
    return { error: authResult.error };
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, providerId: true },
  });

  if (!review || review.providerId !== authResult.provider.id) {
    return { error: "التقييم غير موجود" };
  }

  try {
    await prisma.review.update({
      where: { id: review.id },
      data: {
        providerReply: null,
        providerRepliedAt: null,
      },
    });
  } catch {
    return { error: "تعذر حذف الرد" };
  }

  revalidatePath("/dashboard/reviews");
  revalidateProvider(authResult.provider.slug, authResult.provider.id);
  return { ok: true };
}
