"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  destroyCloudinaryImage,
  verifyUploadedProviderImage,
} from "@/lib/cloudinary";
import { getProviderLimits } from "@/lib/limits";
import { prisma } from "@/lib/prisma";
import { requireOwnedProviderAction } from "@/lib/provider-dashboard";
import { normalizeVideoUrl } from "@/lib/validation";

const captionSchema = z
  .string()
  .trim()
  .optional()
  .default("")
  .transform((val) => val || null)
  .refine((val) => !val || val.length <= 120, {
    message: "التعليق يجب ألا يتجاوز 120 حرفاً",
  });

const addGalleryImageSchema = z.object({
  publicId: z.string().trim().min(1, "معرّف الصورة مطلوب").max(300),
  caption: captionSchema,
});

export async function addGalleryImageAction(input: {
  publicId: string;
  caption?: string;
}): Promise<{ error?: string; ok?: boolean }> {
  const authResult = await requireOwnedProviderAction();
  if (!authResult.ok) {
    return { error: authResult.error };
  }

  const parsed = addGalleryImageSchema.safeParse(input);
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

  const limits = getProviderLimits(authResult.provider);
  const currentImageCount = await prisma.media.count({
    where: { providerId: authResult.provider.id, type: "IMAGE" },
  });

  if (currentImageCount >= limits.images) {
    await destroyCloudinaryImage(verified.publicId).catch(() => undefined);
    return {
      error: `وصلت إلى الحد الأقصى للصور المسموح بها (${limits.images})`,
    };
  }

  const maxSort = await prisma.media.aggregate({
    where: { providerId: authResult.provider.id, type: "IMAGE" },
    _max: { sortOrder: true },
  });

  await prisma.media.create({
    data: {
      providerId: authResult.provider.id,
      type: "IMAGE",
      url: verified.secureUrl,
      cloudinaryPublicId: verified.publicId,
      caption: parsed.data.caption,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/gallery");
  return { ok: true };
}

const addGalleryVideoSchema = z.object({
  url: z.string().trim().min(1, "رابط الفيديو مطلوب").max(500),
  caption: captionSchema,
});

export async function addGalleryVideoAction(input: {
  url: string;
  caption?: string;
}): Promise<{ error?: string; ok?: boolean }> {
  const authResult = await requireOwnedProviderAction();
  if (!authResult.ok) {
    return { error: authResult.error };
  }

  const parsed = addGalleryVideoSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  const normalized = normalizeVideoUrl(parsed.data.url);
  if ("error" in normalized) {
    return { error: normalized.error };
  }

  const limits = getProviderLimits(authResult.provider);
  const currentVideoCount = await prisma.media.count({
    where: { providerId: authResult.provider.id, type: "VIDEO" },
  });

  if (currentVideoCount >= limits.videos) {
    return {
      error: `وصلت إلى الحد الأقصى للفيديوهات المسموح بها (${limits.videos})`,
    };
  }

  const maxSort = await prisma.media.aggregate({
    where: { providerId: authResult.provider.id, type: "VIDEO" },
    _max: { sortOrder: true },
  });

  await prisma.media.create({
    data: {
      providerId: authResult.provider.id,
      type: "VIDEO",
      url: normalized.url,
      caption: parsed.data.caption,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/gallery");
  return { ok: true };
}

const updateCaptionSchema = z.object({
  mediaId: z.string().trim().min(1, "معرّف العنصر مطلوب"),
  caption: captionSchema,
});

export async function updateMediaCaptionAction(input: {
  mediaId: string;
  caption?: string;
}): Promise<{ error?: string; ok?: boolean }> {
  const authResult = await requireOwnedProviderAction();
  if (!authResult.ok) {
    return { error: authResult.error };
  }

  const parsed = updateCaptionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  const existing = await prisma.media.findFirst({
    where: {
      id: parsed.data.mediaId,
      providerId: authResult.provider.id,
    },
    select: { id: true },
  });

  if (!existing) {
    return { error: "العنصر غير موجود أو لا تملك صلاحية تعديله" };
  }

  await prisma.media.update({
    where: { id: existing.id },
    data: { caption: parsed.data.caption },
  });

  revalidatePath("/dashboard/gallery");
  return { ok: true };
}

const deleteMediaSchema = z.object({
  mediaId: z.string().trim().min(1, "معرّف العنصر مطلوب"),
});

export async function deleteMediaAction(input: {
  mediaId: string;
}): Promise<{ error?: string; ok?: boolean }> {
  const authResult = await requireOwnedProviderAction();
  if (!authResult.ok) {
    return { error: authResult.error };
  }

  const parsed = deleteMediaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "بيانات غير صالحة" };
  }

  const media = await prisma.media.findFirst({
    where: {
      id: parsed.data.mediaId,
      providerId: authResult.provider.id,
    },
    select: {
      id: true,
      type: true,
      cloudinaryPublicId: true,
    },
  });

  if (!media) {
    return { error: "العنصر غير موجود أو لا تملك صلاحية حذفه" };
  }

  if (media.type === "IMAGE" && media.cloudinaryPublicId) {
    try {
      await destroyCloudinaryImage(media.cloudinaryPublicId);
    } catch (err) {
      return {
        error:
          err instanceof Error
            ? err.message
            : "تعذر حذف الصورة من Cloudinary",
      };
    }
  }

  await prisma.media.delete({ where: { id: media.id } });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/gallery");
  return { ok: true };
}

const reorderMediaSchema = z.object({
  mediaId: z.string().trim().min(1, "معرّف العنصر مطلوب"),
  direction: z.enum(["up", "down"]),
});

export async function reorderMediaAction(input: {
  mediaId: string;
  direction: "up" | "down";
}): Promise<{ error?: string; ok?: boolean }> {
  const authResult = await requireOwnedProviderAction();
  if (!authResult.ok) {
    return { error: authResult.error };
  }

  const parsed = reorderMediaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "بيانات غير صالحة" };
  }

  const target = await prisma.media.findFirst({
    where: {
      id: parsed.data.mediaId,
      providerId: authResult.provider.id,
    },
    select: { id: true, type: true },
  });

  if (!target) {
    return { error: "العنصر غير موجود أو لا تملك صلاحية تعديله" };
  }

  const items = await prisma.media.findMany({
    where: {
      providerId: authResult.provider.id,
      type: target.type,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  const idx = items.findIndex((m) => m.id === target.id);
  if (idx === -1) {
    return { error: "العنصر غير موجود" };
  }

  const swapIdx = parsed.data.direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= items.length) {
    return { ok: true };
  }

  const reordered = [...items];
  const [moved] = reordered.splice(idx, 1);
  reordered.splice(swapIdx, 0, moved);

  await prisma.$transaction(
    reordered.map((item, sortOrder) =>
      prisma.media.update({
        where: { id: item.id },
        data: { sortOrder },
      })
    )
  );

  revalidatePath("/dashboard/gallery");
  return { ok: true };
}

