"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getProviderLimits } from "@/lib/limits";
import { prisma } from "@/lib/prisma";
import { requireOwnedProviderAction } from "@/lib/provider-dashboard";
import { normalizePlainText } from "@/lib/validation";
import { revalidateProvider } from "@/lib/revalidate";

const priceInputSchema = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((val, ctx): number | null => {
    if (val === null || val === undefined) return null;
    if (typeof val === "number") {
      if (!Number.isInteger(val) || val < 0 || val > 1_000_000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "السعر يجب أن يكون رقماً صحيحاً بين 0 و 1,000,000 جنيه",
        });
        return z.NEVER;
      }
      return val;
    }
    const trimmed = val.trim();
    if (!trimmed) return null;
    if (!/^\d+$/.test(trimmed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "السعر يجب أن يكون رقماً صحيحاً بدون كسور",
      });
      return z.NEVER;
    }
    const num = Number(trimmed);
    if (!Number.isSafeInteger(num) || num < 0 || num > 1_000_000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "السعر يجب أن يكون بين 0 و 1,000,000 جنيه",
      });
      return z.NEVER;
    }
    return num;
  });

const offerFieldsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "عنوان العرض يجب أن يكون حرفين على الأقل")
    .max(80, "عنوان العرض يجب ألا يتجاوز 80 حرفاً"),
  description: z
    .string()
    .optional()
    .default("")
    .transform((val) => {
      const normalized = normalizePlainText(val);
      return normalized || null;
    })
    .refine((val) => !val || val.length <= 1000, {
      message: "وصف العرض يجب ألا يتجاوز 1000 حرف",
    }),
  price: priceInputSchema,
});

export async function createOfferAction(input: {
  title: string;
  description?: string;
  price?: string | number | null;
}): Promise<{ error?: string; ok?: boolean }> {
  const authResult = await requireOwnedProviderAction();
  if (!authResult.ok) {
    return { error: authResult.error };
  }

  const parsed = offerFieldsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  const limits = getProviderLimits(authResult.provider);
  const currentCount = await prisma.offer.count({
    where: { providerId: authResult.provider.id },
  });

  if (currentCount >= limits.offers) {
    return {
      error: `وصلت إلى الحد الأقصى للعروض المسموح بها (${limits.offers})`,
    };
  }

  const maxSort = await prisma.offer.aggregate({
    where: { providerId: authResult.provider.id },
    _max: { sortOrder: true },
  });

  await prisma.offer.create({
    data: {
      providerId: authResult.provider.id,
      title: parsed.data.title,
      description: parsed.data.description,
      price: parsed.data.price,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      isActive: true,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/offers");
  revalidateProvider(authResult.provider.slug, authResult.provider.id);
  return { ok: true };
}

const updateOfferSchema = offerFieldsSchema.extend({
  offerId: z.string().trim().min(1, "معرّف العرض مطلوب"),
});

export async function updateOfferAction(input: {
  offerId: string;
  title: string;
  description?: string;
  price?: string | number | null;
}): Promise<{ error?: string; ok?: boolean }> {
  const authResult = await requireOwnedProviderAction();
  if (!authResult.ok) {
    return { error: authResult.error };
  }

  const parsed = updateOfferSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  const existing = await prisma.offer.findFirst({
    where: {
      id: parsed.data.offerId,
      providerId: authResult.provider.id,
    },
    select: { id: true },
  });

  if (!existing) {
    return { error: "العرض غير موجود أو لا تملك صلاحية تعديله" };
  }

  await prisma.offer.update({
    where: { id: existing.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      price: parsed.data.price,
    },
  });

  revalidatePath("/dashboard/offers");
  revalidateProvider(authResult.provider.slug, authResult.provider.id);
  return { ok: true };
}

const offerIdSchema = z.object({
  offerId: z.string().trim().min(1, "معرّف العرض مطلوب"),
});

export async function toggleOfferActiveAction(input: {
  offerId: string;
}): Promise<{ error?: string; ok?: boolean }> {
  const authResult = await requireOwnedProviderAction();
  if (!authResult.ok) {
    return { error: authResult.error };
  }

  const parsed = offerIdSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "بيانات غير صالحة" };
  }

  const existing = await prisma.offer.findFirst({
    where: {
      id: parsed.data.offerId,
      providerId: authResult.provider.id,
    },
    select: { id: true, isActive: true },
  });

  if (!existing) {
    return { error: "العرض غير موجود أو لا تملك صلاحية تعديله" };
  }

  await prisma.offer.update({
    where: { id: existing.id },
    data: { isActive: !existing.isActive },
  });

  revalidatePath("/dashboard/offers");
  revalidateProvider(authResult.provider.slug, authResult.provider.id);
  return { ok: true };
}

export async function deleteOfferAction(input: {
  offerId: string;
}): Promise<{ error?: string; ok?: boolean }> {
  const authResult = await requireOwnedProviderAction();
  if (!authResult.ok) {
    return { error: authResult.error };
  }

  const parsed = offerIdSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "بيانات غير صالحة" };
  }

  const existing = await prisma.offer.findFirst({
    where: {
      id: parsed.data.offerId,
      providerId: authResult.provider.id,
    },
    select: { id: true },
  });

  if (!existing) {
    return { error: "العرض غير موجود أو لا تملك صلاحية حذفه" };
  }

  await prisma.offer.delete({ where: { id: existing.id } });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/offers");
  revalidateProvider(authResult.provider.slug, authResult.provider.id);
  return { ok: true };
}

const reorderOfferSchema = z.object({
  offerId: z.string().trim().min(1, "معرّف العرض مطلوب"),
  direction: z.enum(["up", "down"]),
});

export async function reorderOfferAction(input: {
  offerId: string;
  direction: "up" | "down";
}): Promise<{ error?: string; ok?: boolean }> {
  const authResult = await requireOwnedProviderAction();
  if (!authResult.ok) {
    return { error: authResult.error };
  }

  const parsed = reorderOfferSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "بيانات غير صالحة" };
  }

  const offers = await prisma.offer.findMany({
    where: { providerId: authResult.provider.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  const idx = offers.findIndex((o) => o.id === parsed.data.offerId);
  if (idx === -1) {
    return { error: "العرض غير موجود أو لا تملك صلاحية تعديله" };
  }

  const targetIdx = parsed.data.direction === "up" ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= offers.length) {
    return { ok: true };
  }

  const reordered = [...offers];
  const [moved] = reordered.splice(idx, 1);
  reordered.splice(targetIdx, 0, moved);

  await prisma.$transaction(
    reordered.map((item, sortOrder) =>
      prisma.offer.update({
        where: { id: item.id },
        data: { sortOrder },
      })
    )
  );

  revalidatePath("/dashboard/offers");
  revalidateProvider(authResult.provider.slug, authResult.provider.id);
  return { ok: true };
}

