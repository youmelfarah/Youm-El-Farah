"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  destroyCloudinaryImage,
  verifyUploadedProviderImage,
} from "@/lib/cloudinary";
import { DISTRICT_VALUES } from "@/lib/districts";
import { prisma } from "@/lib/prisma";
import { requireOwnedProviderAction } from "@/lib/provider-dashboard";
import {
  facebookUrlSchema,
  instagramUrlSchema,
  normalizePlainText,
  optionalEgyptianPhoneSchema,
} from "@/lib/validation";

const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "اسم النشاط يجب أن يكون حرفين على الأقل")
      .max(80, "اسم النشاط يجب ألا يتجاوز 80 حرفاً"),
    bio: z
      .string()
      .optional()
      .default("")
      .transform((val) => {
        const normalized = normalizePlainText(val);
        return normalized || null;
      })
      .refine((val) => !val || val.length <= 1500, {
        message: "النبذة التعريفية يجب ألا تتجاوز 1500 حرف",
      }),
    district: z.enum(DISTRICT_VALUES, {
      error: "يرجى اختيار المركز",
    }),
    address: z
      .string()
      .trim()
      .optional()
      .default("")
      .transform((val) => val || null)
      .refine((val) => !val || val.length <= 200, {
        message: "العنوان يجب ألا يتجاوز 200 حرف",
      }),
    phone: optionalEgyptianPhoneSchema,
    whatsapp: optionalEgyptianPhoneSchema,
    instagramUrl: instagramUrlSchema,
    facebookUrl: facebookUrlSchema,
    categoryIds: z
      .array(z.string().trim().min(1))
      .transform((ids) => Array.from(new Set(ids)))
      .refine((ids) => ids.length >= 1, {
        message: "يجب اختيار تصنيف واحد على الأقل",
      })
      .refine((ids) => ids.length <= 3, {
        message: "يمكنك اختيار 3 تصنيفات كحد أقصى",
      }),
    primaryCategoryId: z.string().trim().min(1, "يرجى تحديد التصنيف الرئيسي"),
  })
  .refine((data) => Boolean(data.phone || data.whatsapp), {
    message: "يجب إدخال رقم الهاتف أو رقم الواتساب على الأقل",
    path: ["phone"],
  })
  .refine((data) => data.categoryIds.includes(data.primaryCategoryId), {
    message: "التصنيف الرئيسي يجب أن يكون ضمن التصنيفات المختارة",
    path: ["primaryCategoryId"],
  });

export async function updateProfileAction(input: {
  name: string;
  bio?: string;
  district: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  categoryIds: string[];
  primaryCategoryId: string;
}): Promise<{ error?: string; ok?: boolean }> {
  const authResult = await requireOwnedProviderAction();
  if (!authResult.ok) {
    return { error: authResult.error };
  }

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  const activeCategories = await prisma.category.findMany({
    where: {
      id: { in: parsed.data.categoryIds },
      isActive: true,
    },
    select: { id: true },
  });

  if (activeCategories.length !== parsed.data.categoryIds.length) {
    return { error: "أحد التصنيفات المختارة غير متاح" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.provider.update({
        where: { id: authResult.provider.id },
        data: {
          name: parsed.data.name,
          bio: parsed.data.bio,
          district: parsed.data.district,
          address: parsed.data.address,
          phone: parsed.data.phone,
          whatsapp: parsed.data.whatsapp,
          instagramUrl: parsed.data.instagramUrl,
          facebookUrl: parsed.data.facebookUrl,
        },
      });

      await tx.providerCategory.deleteMany({
        where: { providerId: authResult.provider.id },
      });

      await tx.providerCategory.createMany({
        data: parsed.data.categoryIds.map((categoryId) => ({
          providerId: authResult.provider.id,
          categoryId,
          isPrimary: categoryId === parsed.data.primaryCategoryId,
        })),
      });
    });
  } catch {
    return { error: "حدث خطأ أثناء حفظ التعديلات" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  return { ok: true };
}

const saveProviderImageSchema = z.object({
  kind: z.enum(["logo", "cover"]),
  publicId: z.string().trim().min(1, "معرّف الصورة مطلوب").max(300),
});

export async function saveProviderImageAction(input: {
  kind: "logo" | "cover";
  publicId: string;
}): Promise<{
  error?: string;
  publicId?: string;
  secureUrl?: string;
}> {
  const authResult = await requireOwnedProviderAction();
  if (!authResult.ok) {
    return { error: authResult.error };
  }

  const parsed = saveProviderImageSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  let verified;
  try {
    verified = await verifyUploadedProviderImage(
      authResult.provider.id,
      parsed.data.publicId
    );
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "فشل التحقق من الصورة المرفوعة",
    };
  }

  const oldPublicId =
    parsed.data.kind === "logo"
      ? authResult.provider.logoPublicId
      : authResult.provider.coverPublicId;

  await prisma.provider.update({
    where: { id: authResult.provider.id },
    data:
      parsed.data.kind === "logo"
        ? { logoUrl: verified.secureUrl, logoPublicId: verified.publicId }
        : { coverUrl: verified.secureUrl, coverPublicId: verified.publicId },
  });

  if (oldPublicId && oldPublicId !== verified.publicId) {
    await destroyCloudinaryImage(oldPublicId).catch(() => undefined);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  return { publicId: verified.publicId, secureUrl: verified.secureUrl };
}

const deleteProviderImageSchema = z.object({
  kind: z.enum(["logo", "cover"]),
});

export async function deleteProviderImageAction(input: {
  kind: "logo" | "cover";
}): Promise<{ error?: string; ok?: boolean }> {
  const authResult = await requireOwnedProviderAction();
  if (!authResult.ok) {
    return { error: authResult.error };
  }

  const parsed = deleteProviderImageSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "طلب غير صالح" };
  }

  const currentPublicId =
    parsed.data.kind === "logo"
      ? authResult.provider.logoPublicId
      : authResult.provider.coverPublicId;

  if (currentPublicId) {
    try {
      await destroyCloudinaryImage(currentPublicId);
    } catch (err) {
      return {
        error:
          err instanceof Error
            ? err.message
            : "تعذر حذف الصورة من Cloudinary",
      };
    }
  }

  await prisma.provider.update({
    where: { id: authResult.provider.id },
    data:
      parsed.data.kind === "logo"
        ? { logoUrl: null, logoPublicId: null }
        : { coverUrl: null, coverPublicId: null },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  return { ok: true };
}

