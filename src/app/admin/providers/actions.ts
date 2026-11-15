"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthError, requireRoleAction } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { ABSOLUTE_MAX } from "@/lib/limits";
import { cancelSubscription, createSubscription } from "@/lib/subscription";
import { revalidateProvider } from "@/lib/revalidate";
import { PaymentMethod } from "@prisma/client";

const idSchema = z.string().trim().min(1, "معرف غير صالح");

const limitsSchema = z.object({
  providerId: idSchema,
  maxOffers: z
    .number()
    .int("يجب أن يكون رقماً صحيحاً")
    .min(0, "الحد الأدنى 0")
    .max(ABSOLUTE_MAX.offers, `الحد الأقصى للعروض هو ${ABSOLUTE_MAX.offers}`)
    .nullable()
    .optional(),
  maxImages: z
    .number()
    .int("يجب أن يكون رقماً صحيحاً")
    .min(0, "الحد الأدنى 0")
    .max(ABSOLUTE_MAX.images, `الحد الأقصى للصور هو ${ABSOLUTE_MAX.images}`)
    .nullable()
    .optional(),
  maxVideos: z
    .number()
    .int("يجب أن يكون رقماً صحيحاً")
    .min(0, "الحد الأدنى 0")
    .max(ABSOLUTE_MAX.videos, `الحد الأقصى للفيديوهات هو ${ABSOLUTE_MAX.videos}`)
    .nullable()
    .optional(),
});

const notesSchema = z.object({
  providerId: idSchema,
  adminNotes: z
    .string()
    .max(2000, "الملاحظات يجب ألا تتجاوز 2000 حرف")
    .default(""),
});

const createSubscriptionSchema = z.object({
  providerId: idSchema,
  startDate: z.string().trim().optional(),
  months: z.number().int().positive().optional(),
  endDate: z.string().trim().optional(),
  amountPaid: z
    .number()
    .int("المبلغ يجب أن يكون عدداً صحيحاً")
    .min(0, "المبلغ لا يمكن أن يكون سالباً")
    .max(10_000_000, "المبلغ كبير جداً"),
  paymentMethod: z.enum(["CASH", "INSTAPAY", "VODAFONE_CASH", "OTHER"] as const),
  paymentNote: z.string().trim().max(500).optional(),
  planName: z.string().trim().max(100).optional(),
});

export async function approveProviderAction(input: {
  providerId: string;
}): Promise<{ ok?: boolean; error?: string }> {
  let session;
  try {
    session = await requireRoleAction("ADMIN");
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    return { error: "ليس لديك صلاحية للوصول" };
  }

  const parsedId = idSchema.safeParse(input.providerId);
  if (!parsedId.success) return { error: "معرف غير صالح" };

  try {
    let targetSlug = "";
    await prisma.$transaction(async (tx) => {
      const provider = await tx.provider.findUnique({
        where: { id: parsedId.data },
        select: { id: true, status: true, slug: true },
      });

      if (!provider) {
        throw new Error("مقدم الخدمة غير موجود");
      }

      if (provider.status === "APPROVED") {
        throw new Error("المقدم معتمد بالفعل");
      }

      targetSlug = provider.slug;

      await tx.provider.update({
        where: { id: parsedId.data },
        data: { status: "APPROVED" },
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "provider.approve",
          entityType: "Provider",
          entityId: parsedId.data,
          providerId: parsedId.data,
          details: {
            before: { status: provider.status },
            after: { status: "APPROVED" },
          },
        },
      });
    });

    if (targetSlug) {
      revalidateProvider(targetSlug, parsedId.data);
    }
    revalidatePath("/admin/providers");
    revalidatePath(`/admin/providers/${parsedId.data}`);
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "حدث خطأ أثناء اعتماد الحساب" };
  }
}

export async function suspendProviderAction(input: {
  providerId: string;
  reason?: string;
}): Promise<{ ok?: boolean; error?: string }> {
  let session;
  try {
    session = await requireRoleAction("ADMIN");
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    return { error: "ليس لديك صلاحية للوصول" };
  }

  const parsedId = idSchema.safeParse(input.providerId);
  if (!parsedId.success) return { error: "معرف غير صالح" };

  try {
    let targetSlug = "";
    await prisma.$transaction(async (tx) => {
      const provider = await tx.provider.findUnique({
        where: { id: parsedId.data },
        select: { id: true, status: true, slug: true },
      });

      if (!provider) {
        throw new Error("مقدم الخدمة غير موجود");
      }

      if (provider.status === "SUSPENDED") {
        throw new Error("المقدم موقوف بالفعل");
      }

      targetSlug = provider.slug;

      await tx.provider.update({
        where: { id: parsedId.data },
        data: { status: "SUSPENDED" },
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "provider.suspend",
          entityType: "Provider",
          entityId: parsedId.data,
          providerId: parsedId.data,
          details: {
            before: { status: provider.status },
            after: { status: "SUSPENDED" },
            reason: input.reason?.trim() || null,
          },
        },
      });
    });

    if (targetSlug) {
      revalidateProvider(targetSlug, parsedId.data);
    }
    revalidatePath("/admin/providers");
    revalidatePath(`/admin/providers/${parsedId.data}`);
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "حدث خطأ أثناء إيقاف الحساب" };
  }
}

export async function reactivateProviderAction(input: {
  providerId: string;
}): Promise<{ ok?: boolean; error?: string }> {
  let session;
  try {
    session = await requireRoleAction("ADMIN");
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    return { error: "ليس لديك صلاحية للوصول" };
  }

  const parsedId = idSchema.safeParse(input.providerId);
  if (!parsedId.success) return { error: "معرف غير صالح" };

  try {
    let targetSlug = "";
    await prisma.$transaction(async (tx) => {
      const provider = await tx.provider.findUnique({
        where: { id: parsedId.data },
        select: { id: true, status: true, slug: true },
      });

      if (!provider) {
        throw new Error("مقدم الخدمة غير موجود");
      }

      if (provider.status === "APPROVED") {
        throw new Error("المقدم مفعّل بالفعل");
      }

      targetSlug = provider.slug;

      await tx.provider.update({
        where: { id: parsedId.data },
        data: { status: "APPROVED" },
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "provider.reactivate",
          entityType: "Provider",
          entityId: parsedId.data,
          providerId: parsedId.data,
          details: {
            before: { status: provider.status },
            after: { status: "APPROVED" },
          },
        },
      });
    });

    if (targetSlug) {
      revalidateProvider(targetSlug, parsedId.data);
    }
    revalidatePath("/admin/providers");
    revalidatePath(`/admin/providers/${parsedId.data}`);
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "حدث خطأ أثناء إعادة تفعيل الحساب" };
  }
}

export async function updateProviderLimitsAction(input: {
  providerId: string;
  maxOffers?: number | null;
  maxImages?: number | null;
  maxVideos?: number | null;
}): Promise<{ ok?: boolean; error?: string }> {
  let session;
  try {
    session = await requireRoleAction("ADMIN");
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    return { error: "ليس لديك صلاحية للوصول" };
  }

  const parsed = limitsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const provider = await tx.provider.findUnique({
        where: { id: parsed.data.providerId },
        select: {
          id: true,
          maxOffers: true,
          maxImages: true,
          maxVideos: true,
        },
      });

      if (!provider) {
        throw new Error("مقدم الخدمة غير موجود");
      }

      await tx.provider.update({
        where: { id: parsed.data.providerId },
        data: {
          maxOffers: parsed.data.maxOffers ?? null,
          maxImages: parsed.data.maxImages ?? null,
          maxVideos: parsed.data.maxVideos ?? null,
        },
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "provider.limits_update",
          entityType: "Provider",
          entityId: parsed.data.providerId,
          providerId: parsed.data.providerId,
          details: {
            before: {
              maxOffers: provider.maxOffers,
              maxImages: provider.maxImages,
              maxVideos: provider.maxVideos,
            },
            after: {
              maxOffers: parsed.data.maxOffers ?? null,
              maxImages: parsed.data.maxImages ?? null,
              maxVideos: parsed.data.maxVideos ?? null,
            },
          },
        },
      });
    });

    revalidatePath(`/admin/providers/${parsed.data.providerId}`);
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "حدث خطأ أثناء تعديل الحدود" };
  }
}

export async function updateProviderNotesAction(input: {
  providerId: string;
  adminNotes: string;
}): Promise<{ ok?: boolean; error?: string }> {
  let session;
  try {
    session = await requireRoleAction("ADMIN");
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    return { error: "ليس لديك صلاحية للوصول" };
  }

  const parsed = notesSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const provider = await tx.provider.findUnique({
        where: { id: parsed.data.providerId },
        select: { id: true, adminNotes: true },
      });

      if (!provider) {
        throw new Error("مقدم الخدمة غير موجود");
      }

      await tx.provider.update({
        where: { id: parsed.data.providerId },
        data: { adminNotes: parsed.data.adminNotes.trim() || null },
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "provider.notes_update",
          entityType: "Provider",
          entityId: parsed.data.providerId,
          providerId: parsed.data.providerId,
          details: {
            notesLength: parsed.data.adminNotes.trim().length,
          },
        },
      });
    });

    revalidatePath(`/admin/providers/${parsed.data.providerId}`);
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "حدث خطأ أثناء حفظ الملاحظات" };
  }
}

export async function createProviderSubscriptionAction(
  input: z.infer<typeof createSubscriptionSchema>
): Promise<{ ok?: boolean; error?: string }> {
  let session;
  try {
    session = await requireRoleAction("ADMIN");
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    return { error: "ليس لديك صلاحية للوصول" };
  }

  const parsed = createSubscriptionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  try {
    await createSubscription({
      providerId: parsed.data.providerId,
      adminId: session.user.id,
      startDate: parsed.data.startDate,
      months: parsed.data.months,
      endDate: parsed.data.endDate,
      amountPaid: parsed.data.amountPaid,
      paymentMethod: parsed.data.paymentMethod as PaymentMethod,
      paymentNote: parsed.data.paymentNote,
      planName: parsed.data.planName,
    });

    const prov = await prisma.provider.findUnique({
      where: { id: parsed.data.providerId },
      select: { slug: true },
    });
    if (prov) {
      revalidateProvider(prov.slug, parsed.data.providerId);
    }

    revalidatePath("/admin");
    revalidatePath("/admin/providers");
    revalidatePath(`/admin/providers/${parsed.data.providerId}`);
    revalidatePath("/admin/subscriptions");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "حدث خطأ أثناء إنشاء الاشتراك" };
  }
}

export async function cancelProviderSubscriptionAction(input: {
  subscriptionId: string;
  reason?: string;
}): Promise<{ ok?: boolean; error?: string }> {
  let session;
  try {
    session = await requireRoleAction("ADMIN");
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    return { error: "ليس لديك صلاحية للوصول" };
  }

  const parsedId = idSchema.safeParse(input.subscriptionId);
  if (!parsedId.success) return { error: "معرف غير صالح" };

  try {
    const sub = await cancelSubscription({
      subscriptionId: parsedId.data,
      adminId: session.user.id,
      reason: input.reason?.trim() || null,
    });

    const prov = await prisma.provider.findUnique({
      where: { id: sub.providerId },
      select: { slug: true },
    });
    if (prov) {
      revalidateProvider(prov.slug, sub.providerId);
    }

    revalidatePath("/admin");
    revalidatePath("/admin/providers");
    revalidatePath(`/admin/providers/${sub.providerId}`);
    revalidatePath("/admin/subscriptions");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "حدث خطأ أثناء إلغاء الاشتراك" };
  }
}
