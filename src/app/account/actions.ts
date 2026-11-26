"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { AuthError, requireRoleAction, requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { recomputeProviderRatingAggregates } from "@/lib/review-aggregates";
import { revalidateProvider } from "@/lib/revalidate";

function generateShareToken(): string {
  return randomBytes(18).toString("base64url");
}

export async function createOrRotateFavoritesShareTokenAction(): Promise<{
  ok?: boolean;
  token?: string;
  error?: string;
}> {
  let session;
  try {
    session = await requireRoleAction("VISITOR");
  } catch {
    return { error: "ميزة مشاركة المفضلة متاحة لحسابات الزائرات فقط" };
  }

  const token = generateShareToken();
  await prisma.user.update({
    where: { id: session.user.id },
    data: { favoritesShareToken: token },
  });

  revalidatePath("/account/favorites");
  return { ok: true, token };
}

export async function disableFavoritesShareTokenAction(): Promise<{
  ok?: boolean;
  error?: string;
}> {
  let session;
  try {
    session = await requireRoleAction("VISITOR");
  } catch {
    return { error: "ميزة مشاركة المفضلة متاحة لحسابات الزائرات فقط" };
  }

  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { favoritesShareToken: true },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { favoritesShareToken: null },
  });

  if (existing?.favoritesShareToken) {
    revalidatePath(`/list/${existing.favoritesShareToken}`);
  }
  revalidatePath("/account/favorites");
  return { ok: true };
}

export async function removeFavoriteAction(providerId: string): Promise<{
  ok?: boolean;
  error?: string;
}> {
  let session;
  try {
    session = await requireRoleAction("VISITOR");
  } catch {
    return { error: "غير مصرح" };
  }

  await prisma.favorite.deleteMany({
    where: {
      userId: session.user.id,
      providerId,
    },
  });

  revalidatePath("/account/favorites");
  revalidatePath("/account");
  return { ok: true };
}

export async function deleteMyAccountAction(confirmationText: string): Promise<{
  ok?: boolean;
  error?: string;
}> {
  let session;
  try {
    session = await requireUser({ isServerAction: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: err.message };
    }
    return { error: "يجب تسجيل الدخول" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!user) {
    return { error: "الحساب غير موجود" };
  }

  if (user.role === "ADMIN" || user.role === "PROVIDER") {
    return {
      error:
        "لا يمكن حذف حسابات مقدمي الخدمة أو الإدارة من هنا. يرجى التواصل مع إدارة المنصة.",
    };
  }

  if (confirmationText.trim() !== "حذف حسابي") {
    return { error: "يرجى كتابة عبارة «حذف حسابي» بشكل مطابق للتأكيد" };
  }

  // Find providers whose approved review aggregates may change after deletion
  const affectedReviews = await prisma.review.findMany({
    where: { userId: user.id, status: "APPROVED" },
    select: {
      providerId: true,
      provider: { select: { slug: true } },
    },
  });

  const affectedProviders = Array.from(
    new Map(
      affectedReviews.map((r) => [r.providerId, r.provider.slug])
    ).entries()
  );

  try {
    await prisma.$transaction(async (tx) => {
      await tx.reviewReport.deleteMany({ where: { reporterId: user.id } });
      await tx.review.deleteMany({ where: { userId: user.id } });
      await tx.favorite.deleteMany({ where: { userId: user.id } });
      await tx.lead.deleteMany({ where: { userId: user.id } });
      await tx.verification.deleteMany({
        where: { identifier: `phone-otp:${user.id}` },
      });
      await tx.session.deleteMany({ where: { userId: user.id } });
      await tx.account.deleteMany({ where: { userId: user.id } });
      await tx.user.delete({ where: { id: user.id } });

      for (const [providerId] of affectedProviders) {
        await recomputeProviderRatingAggregates(tx, providerId);
      }
    });
  } catch {
    return { error: "تعذر حذف الحساب حالياً. يرجى المحاولة لاحقاً." };
  }

  for (const [providerId, slug] of affectedProviders) {
    revalidateProvider(slug, providerId);
  }
  revalidatePath("/");
  revalidatePath("/account");
  return { ok: true };
}
