"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthError, requireRoleAction } from "@/lib/auth-helpers";
import { DISTRICT_VALUES } from "@/lib/districts";
import { prisma } from "@/lib/prisma";
import { generateUniqueProviderSlug } from "@/lib/slug";
import { optionalEgyptianPhoneSchema } from "@/lib/validation";

const onboardingSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "اسم النشاط يجب أن يكون حرفين على الأقل")
      .max(80, "اسم النشاط يجب ألا يتجاوز 80 حرفاً"),
    primaryCategoryId: z.string().trim().min(1, "يرجى اختيار التصنيف الرئيسي"),
    district: z.enum(DISTRICT_VALUES, {
      error: "يرجى اختيار المركز",
    }),
    phone: optionalEgyptianPhoneSchema,
    whatsapp: optionalEgyptianPhoneSchema,
  })
  .refine((data) => Boolean(data.phone || data.whatsapp), {
    message: "يجب إدخال رقم الهاتف أو رقم الواتساب على الأقل",
    path: ["phone"],
  });

export async function completeOnboardingAction(input: {
  name: string;
  primaryCategoryId: string;
  district: string;
  phone?: string;
  whatsapp?: string;
}): Promise<{ error?: string; ok?: boolean }> {
  let session;
  try {
    session = await requireRoleAction("PROVIDER");
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: err.message };
    }
    return { error: "ليس لديك صلاحية للوصول" };
  }

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  const existingProvider = await prisma.provider.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (existingProvider) {
    return { error: "تم إنشاء ملف مقدم الخدمة بالفعل" };
  }

  const category = await prisma.category.findFirst({
    where: {
      id: parsed.data.primaryCategoryId,
      isActive: true,
    },
    select: { id: true },
  });
  if (!category) {
    return { error: "التصنيف المختار غير متاح" };
  }

  const slug = await generateUniqueProviderSlug(parsed.data.name);

  try {
    await prisma.$transaction(async (tx) => {
      const provider = await tx.provider.create({
        data: {
          userId: session.user.id,
          slug,
          name: parsed.data.name,
          district: parsed.data.district,
          phone: parsed.data.phone,
          whatsapp: parsed.data.whatsapp,
          status: "PENDING",
        },
      });

      await tx.providerCategory.create({
        data: {
          providerId: provider.id,
          categoryId: category.id,
          isPrimary: true,
        },
      });
    });
  } catch {
    return { error: "حدث خطأ أثناء حفظ البيانات. يرجى المحاولة مرة أخرى." };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

