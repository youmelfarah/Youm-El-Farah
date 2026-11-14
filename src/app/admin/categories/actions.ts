"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthError, requireRoleAction } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const idSchema = z.string().trim().min(1, "معرف غير صالح");

const createCategorySchema = z.object({
  nameAr: z
    .string()
    .trim()
    .min(2, "اسم الفئة يجب أن يكون حرفين على الأقل")
    .max(100, "اسم الفئة طويل جداً"),
  slug: z
    .string()
    .trim()
    .min(2, "المعرف الإنجليزي يجب أن يكون حرفين على الأقل")
    .max(50, "المعرف الإنجليزي طويل جداً")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "المعرف يجب أن يتكون من حروف إنجليزية صغيرة وأرقام وشرطات فقط بدون مسافات (kebab-case)"
    ),
});

const updateCategorySchema = z.object({
  categoryId: idSchema,
  nameAr: z
    .string()
    .trim()
    .min(2, "اسم الفئة يجب أن يكون حرفين على الأقل")
    .max(100, "اسم الفئة طويل جداً"),
});

export async function createCategoryAction(
  input: z.infer<typeof createCategorySchema>
): Promise<{ ok?: boolean; error?: string }> {
  let session;
  try {
    session = await requireRoleAction("ADMIN");
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    return { error: "ليس لديك صلاحية للوصول" };
  }

  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.category.findUnique({
        where: { slug: parsed.data.slug },
      });
      if (existing) {
        throw new Error("المعرف الإنجليزي (slug) مستخدم بالفعل");
      }

      const maxOrder = await tx.category.aggregate({
        _max: { sortOrder: true },
      });
      const nextSortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

      const cat = await tx.category.create({
        data: {
          nameAr: parsed.data.nameAr,
          slug: parsed.data.slug,
          sortOrder: nextSortOrder,
          isActive: true,
        },
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "category.create",
          entityType: "Category",
          entityId: cat.id,
          details: {
            nameAr: cat.nameAr,
            slug: cat.slug,
            sortOrder: nextSortOrder,
          },
        },
      });
    });

    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "حدث خطأ أثناء إنشاء الفئة" };
  }
}

export async function updateCategoryAction(
  input: z.infer<typeof updateCategorySchema>
): Promise<{ ok?: boolean; error?: string }> {
  let session;
  try {
    session = await requireRoleAction("ADMIN");
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    return { error: "ليس لديك صلاحية للوصول" };
  }

  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.category.findUnique({
        where: { id: parsed.data.categoryId },
      });
      if (!existing) {
        throw new Error("الفئة غير موجودة");
      }

      await tx.category.update({
        where: { id: parsed.data.categoryId },
        data: { nameAr: parsed.data.nameAr },
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "category.update",
          entityType: "Category",
          entityId: parsed.data.categoryId,
          details: {
            before: { nameAr: existing.nameAr },
            after: { nameAr: parsed.data.nameAr },
          },
        },
      });
    });

    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "حدث خطأ أثناء تعديل الفئة" };
  }
}

export async function reorderCategoryAction(input: {
  categoryId: string;
  direction: "up" | "down";
}): Promise<{ ok?: boolean; error?: string }> {
  let session;
  try {
    session = await requireRoleAction("ADMIN");
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    return { error: "ليس لديك صلاحية للوصول" };
  }

  const parsedId = idSchema.safeParse(input.categoryId);
  if (!parsedId.success) return { error: "معرف غير صالح" };

  try {
    await prisma.$transaction(async (tx) => {
      const categories = await tx.category.findMany({
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      });

      const currentIndex = categories.findIndex((c) => c.id === parsedId.data);
      if (currentIndex === -1) {
        throw new Error("الفئة غير موجودة");
      }

      const targetIndex =
        input.direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= categories.length) {
        return; // Already at edge
      }

      const current = categories[currentIndex];
      const target = categories[targetIndex];

      const currentOrder = current.sortOrder;
      const targetOrder = target.sortOrder;

      // Swap sortOrders (if they happen to be equal, increment)
      const newCurrentOrder = currentOrder === targetOrder
        ? (input.direction === "up" ? targetOrder - 1 : targetOrder + 1)
        : targetOrder;
      const newTargetOrder = currentOrder;

      await tx.category.update({
        where: { id: current.id },
        data: { sortOrder: newCurrentOrder },
      });

      await tx.category.update({
        where: { id: target.id },
        data: { sortOrder: newTargetOrder },
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "category.reorder",
          entityType: "Category",
          entityId: current.id,
          details: {
            direction: input.direction,
            swappedWith: target.id,
            oldOrder: currentOrder,
            newOrder: newCurrentOrder,
          },
        },
      });
    });

    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "حدث خطأ أثناء إعادة الترتيب" };
  }
}

export async function toggleCategoryActiveAction(input: {
  categoryId: string;
}): Promise<{ ok?: boolean; error?: string }> {
  let session;
  try {
    session = await requireRoleAction("ADMIN");
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    return { error: "ليس لديك صلاحية للوصول" };
  }

  const parsedId = idSchema.safeParse(input.categoryId);
  if (!parsedId.success) return { error: "معرف غير صالح" };

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.category.findUnique({
        where: { id: parsedId.data },
      });
      if (!existing) {
        throw new Error("الفئة غير موجودة");
      }

      const newIsActive = !existing.isActive;

      await tx.category.update({
        where: { id: parsedId.data },
        data: { isActive: newIsActive },
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "category.toggle",
          entityType: "Category",
          entityId: parsedId.data,
          details: {
            before: { isActive: existing.isActive },
            after: { isActive: newIsActive },
          },
        },
      });
    });

    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "حدث خطأ أثناء تغيير حالة الفئة" };
  }
}

export async function deleteCategoryAction(input: {
  categoryId: string;
}): Promise<{ ok?: boolean; error?: string }> {
  let session;
  try {
    session = await requireRoleAction("ADMIN");
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    return { error: "ليس لديك صلاحية للوصول" };
  }

  const parsedId = idSchema.safeParse(input.categoryId);
  if (!parsedId.success) return { error: "معرف غير صالح" };

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.category.findUnique({
        where: { id: parsedId.data },
      });
      if (!existing) {
        throw new Error("الفئة غير موجودة");
      }

      // Check linked providers
      const providerCount = await tx.providerCategory.count({
        where: { categoryId: parsedId.data },
      });

      if (providerCount > 0) {
        throw new Error("لا يمكن حذف الفئة لوجود مقدمي خدمة مرتبطين بها");
      }

      await tx.category.delete({
        where: { id: parsedId.data },
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "category.delete",
          entityType: "Category",
          entityId: parsedId.data,
          details: {
            nameAr: existing.nameAr,
            slug: existing.slug,
          },
        },
      });
    });

    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "حدث خطأ أثناء حذف الفئة" };
  }
}
